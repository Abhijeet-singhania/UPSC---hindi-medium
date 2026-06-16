"""Persisted Ask-AI chat sessions and messages."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import AiChatMessage, AiChatMessageRole, AiChatSession, User
from app.schemas.ai_chat import ChatMessageOut, CitationOut

_MAX_TITLE_LEN = 80
_HISTORY_TURNS = 8


def _title_from_message(text: str) -> str:
    clean = " ".join(text.split())
    if len(clean) <= _MAX_TITLE_LEN:
        return clean or "New chat"
    return clean[: _MAX_TITLE_LEN - 1].rstrip() + "…"


def create_session(
    db: Session,
    user: User,
    *,
    title: str = "New chat",
    language: Optional[str] = None,
) -> AiChatSession:
    session = AiChatSession(
        user_id=user.id,
        title=title,
        language=language or user.preferred_language or "hi",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_user_session(db: Session, session_id: int, user_id: int) -> Optional[AiChatSession]:
    return (
        db.query(AiChatSession)
        .filter(AiChatSession.id == session_id, AiChatSession.user_id == user_id)
        .first()
    )


def list_user_sessions(db: Session, user_id: int, *, skip: int = 0, limit: int = 50) -> list[dict]:
    rows = (
        db.query(
            AiChatSession,
            func.count(AiChatMessage.id).label("message_count"),
        )
        .outerjoin(AiChatMessage, AiChatMessage.session_id == AiChatSession.id)
        .filter(AiChatSession.user_id == user_id)
        .group_by(AiChatSession.id)
        .order_by(AiChatSession.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for session, count in rows:
        result.append({
            "id": session.id,
            "title": session.title,
            "language": session.language,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "message_count": count or 0,
        })
    return result


def delete_session(db: Session, session: AiChatSession) -> None:
    db.delete(session)
    db.commit()


def add_message(
    db: Session,
    session: AiChatSession,
    *,
    role: AiChatMessageRole,
    content: str,
    citations: Optional[list[dict]] = None,
    retrieved_chunks: Optional[int] = None,
    blocked: bool = False,
    error: bool = False,
) -> AiChatMessage:
    msg = AiChatMessage(
        session_id=session.id,
        role=role,
        content=content,
        citations_json=json.dumps(citations) if citations else None,
        retrieved_chunks=retrieved_chunks,
        blocked=blocked,
        error=error,
    )
    db.add(msg)
    session.updated_at = datetime.now(timezone.utc)
    if role == AiChatMessageRole.USER and session.title == "New chat":
        session.title = _title_from_message(content)
    db.commit()
    db.refresh(msg)
    return msg


def get_conversation_history(db: Session, session_id: int, *, limit: int = _HISTORY_TURNS) -> list[dict]:
    """Recent user/assistant turns for multi-turn Gemini context."""
    rows = (
        db.query(AiChatMessage)
        .filter(AiChatMessage.session_id == session_id)
        .order_by(AiChatMessage.created_at.desc())
        .limit(limit * 2)
        .all()
    )
    rows.reverse()
    history = []
    for row in rows:
        if row.blocked or row.error:
            continue
        history.append({
            "role": "user" if row.role == AiChatMessageRole.USER else "assistant",
            "content": row.content,
        })
    return history[-limit * 2 :]


def message_to_out(msg: AiChatMessage) -> ChatMessageOut:
    citations: list[CitationOut] = []
    if msg.citations_json:
        try:
            raw = json.loads(msg.citations_json)
            citations = [CitationOut(**c) for c in raw]
        except (json.JSONDecodeError, TypeError, ValueError):
            pass
    return ChatMessageOut(
        id=msg.id,
        role=msg.role.value,
        content=msg.content,
        citations=citations,
        retrieved_chunks=msg.retrieved_chunks,
        blocked=msg.blocked or False,
        error=msg.error or False,
        created_at=msg.created_at,
    )
