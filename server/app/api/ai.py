"""
AI layer router — all /api/v1/ai/* endpoints.

Phase 2: POST /ai/chat                   — RAG-based Ask-AI tutor
Phase 3: GET  /ai/related                — cross-link content items
Phase 4: GET  /ai/recommendations        — personalised daily suggestions
         GET  /ai/daily-plan             — personalised time-blocked study plan
Phase 1: POST /ai/admin/reindex          — trigger content backfill (admin)
         GET  /ai/admin/reindex-status   — poll backfill progress (admin)
Study:   POST /ai/admin/upload-material  — upload PDF/text study material
         GET  /ai/admin/materials        — list indexed materials
         DELETE /ai/admin/materials/{id} — remove a material
         GET  /ai/admin/upload-status    — poll upload/ingestion progress
"""
from __future__ import annotations

import os
import shutil
import tempfile
import threading
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.users import get_current_user
from app.db.database import get_db
from app.db.models import AiChatMessageRole, ContentChunk, CurrentAffair, User, UserRole
from app.services import chat_service, material_status, reindex_status
from app.schemas.ai_chat import (
    ChatSessionCreate,
    ChatSessionDetail,
    ChatSessionSummary,
    ChatSessionUpdate,
)
from app.services.rag_service import (
    build_context,
    find_related,
    generate,
    is_upsc_relevant,
    refusal_message,
    retrieve,
)
from app.services.learning_profile_service import build_daily_plan, build_recommendations, get_profile

router = APIRouter()
logger = logging.getLogger(__name__)


def _ensure_admin(user: User) -> None:
    if user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Admin access required")


# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None
    language: Optional[str] = None     # override preferred_language
    gs_filter: Optional[str] = None    # e.g. "GS2"
    subject_filter: Optional[str] = None
    source_types: Optional[list[str]] = None  # restrict retrieval to these types


class CitationOut(BaseModel):
    index: int
    source_type: str
    source_id: int
    title: str
    gs_paper: Optional[str] = None
    subject: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: int
    answer: str
    citations: list[CitationOut]
    retrieved_chunks: int
    blocked: bool = False


# ── Chat sessions (history) ───────────────────────────────────────────────────

@router.get("/sessions", response_model=list[ChatSessionSummary])
def list_chat_sessions(
    skip: int = 0,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the user's Ask-AI chat sessions, newest first."""
    rows = chat_service.list_user_sessions(db, current_user.id, skip=skip, limit=limit)
    return [ChatSessionSummary(**r) for r in rows]


@router.post("/sessions", response_model=ChatSessionSummary)
def create_chat_session(
    body: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create an empty chat session."""
    session = chat_service.create_session(
        db,
        current_user,
        title=body.title or "New chat",
        language=body.language,
    )
    return ChatSessionSummary(
        id=session.id,
        title=session.title,
        language=session.language,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=0,
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def get_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Load a chat session with full message history."""
    session = chat_service.get_user_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return ChatSessionDetail(
        id=session.id,
        title=session.title,
        language=session.language,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[chat_service.message_to_out(m) for m in session.messages],
    )


@router.patch("/sessions/{session_id}", response_model=ChatSessionSummary)
def update_chat_session(
    session_id: int,
    body: ChatSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = chat_service.get_user_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    if body.title is not None:
        session.title = body.title.strip() or session.title
    db.commit()
    db.refresh(session)
    count = len(session.messages)
    return ChatSessionSummary(
        id=session.id,
        title=session.title,
        language=session.language,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=count,
    )


@router.delete("/sessions/{session_id}", status_code=204)
def delete_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = chat_service.get_user_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    chat_service.delete_session(db, session)


# ── Phase 2: Chat endpoint ────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    RAG-based Ask-AI tutor.

    1. Embeds the user's message
    2. Retrieves the top-k semantically similar content chunks
    3. Builds a grounded context within the token budget
    4. Generates a cited answer via Gemini
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    language = request.language or current_user.preferred_language or "hi"
    logger.info(
        "Chat request user=%s session=%s lang=%s msg_len=%d",
        current_user.id,
        request.session_id,
        language,
        len(request.message),
    )

    if request.session_id:
        session = chat_service.get_user_session(db, request.session_id, current_user.id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        session = chat_service.create_session(db, current_user, language=language)
        logger.info("Created new chat session id=%s for user=%s", session.id, current_user.id)

    history = chat_service.get_conversation_history(db, session.id)

    chat_service.add_message(
        db,
        session,
        role=AiChatMessageRole.USER,
        content=request.message.strip(),
    )

    if not is_upsc_relevant(request.message):
        logger.info("Chat blocked (off-topic) session=%s user=%s", session.id, current_user.id)
        answer = refusal_message(language)
        chat_service.add_message(
            db,
            session,
            role=AiChatMessageRole.ASSISTANT,
            content=answer,
            blocked=True,
        )
        return ChatResponse(
            session_id=session.id,
            answer=answer,
            citations=[],
            retrieved_chunks=0,
            blocked=True,
        )

    chunks = retrieve(
        db,
        query=request.message,
        source_types=request.source_types,
        language=language,
        gs_paper=request.gs_filter,
        subject=request.subject_filter,
    )
    logger.info("RAG retrieved %d chunks for session=%s", len(chunks), session.id)

    context, citations = build_context(chunks)
    logger.info(
        "Built context session=%s citations=%d context_chars=%d",
        session.id,
        len(citations),
        len(context),
    )

    if not context.strip():
        logger.info("Generating answer without RAG context session=%s", session.id)
        answer = generate(request.message, "", language=language, history=history)
    else:
        answer = generate(request.message, context, language=language, history=history)

    logger.info(
        "Chat complete session=%s user=%s answer_chars=%d",
        session.id,
        current_user.id,
        len(answer),
    )

    chat_service.add_message(
        db,
        session,
        role=AiChatMessageRole.ASSISTANT,
        content=answer,
        citations=citations,
        retrieved_chunks=len(chunks),
    )

    return ChatResponse(
        session_id=session.id,
        answer=answer,
        citations=[CitationOut(**c) for c in citations],
        retrieved_chunks=len(chunks),
    )


# ── Phase 3: Related content (cross-linking) ─────────────────────────────────

@router.get("/related")
def get_related(
    source_type: str = Query(..., description="affair | pyq | quiz | daily_q"),
    source_id: int = Query(...),
    want: Optional[str] = Query(
        None,
        description="Comma-separated target types to return. Default: all other types.",
    ),
    top_k: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
):
    """
    Return semantically similar content items of other types.

    Example: /ai/related?source_type=affair&source_id=7&want=pyq,quiz
    Returns PYQs and quiz questions related to current affair #7.
    """
    valid_types = {"affair", "pyq", "quiz", "daily_q"}
    if source_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"source_type must be one of {valid_types}")

    want_types = None
    if want:
        want_types = [t.strip() for t in want.split(",") if t.strip() in valid_types]

    related = find_related(db, source_type, source_id, want_types=want_types, top_k=top_k)
    return {"source_type": source_type, "source_id": source_id, "related": related}


# ── Phase 4: Personalised recommendations ────────────────────────────────────

@router.get("/recommendations")
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return today's personalised study recommendations for the authenticated learner.
    Based on exam_stage, optional_subject, weak subjects from recent mock tests, and streak.
    """
    profile = get_profile(db, current_user)

    # Get today's CA subject tags to contextualise recommendations
    from datetime import date
    today_ca = (
        db.query(CurrentAffair.subject_tags)
        .filter(
            CurrentAffair.is_published == True,
            CurrentAffair.is_upsc_relevant == True,
            CurrentAffair.published_date == date.today(),
        )
        .limit(5)
        .all()
    )
    today_subjects = []
    for row in today_ca:
        if row[0]:
            today_subjects.extend(t.strip() for t in row[0].split(",") if t.strip())

    recs = build_recommendations(profile, today_subjects)
    return {"profile_snapshot": profile, "recommendations": recs}


@router.get("/daily-plan")
def get_daily_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return a time-blocked daily study plan personalised for the learner's exam stage
    and detected weak subjects.
    """
    profile = get_profile(db, current_user)
    plan = build_daily_plan(profile)
    return {
        "exam_stage": profile["exam_stage"],
        "optional_subject": profile.get("optional_subject"),
        "weak_subjects": profile.get("weak_subjects", []),
        "plan": plan,
    }


# ── Phase 1/Admin: reindex endpoints ─────────────────────────────────────────

@router.post("/admin/reindex", status_code=202)
def trigger_reindex(current_user: User = Depends(get_current_user)):
    """
    Manually trigger a full content backfill (re-embed all published/approved content).
    Runs in a background thread. Admin/Moderator only.
    """
    _ensure_admin(current_user)

    snap = reindex_status.get_snapshot()
    if snap["status"] == "running":
        raise HTTPException(
            status_code=409,
            detail="Reindex is already running. Poll GET /admin/reindex-status for progress.",
        )

    from app.services.indexing_service import backfill_all

    def _run():
        backfill_all(triggered_by=f"admin:{current_user.id}")

    threading.Thread(target=_run, daemon=True, name="ai-reindex").start()

    return {
        "status": "started",
        "message": "AI content reindex started in background. This may take a few minutes.",
    }


@router.get("/admin/reindex-status")
def get_reindex_status(current_user: User = Depends(get_current_user)):
    """Poll the progress of the AI reindex job. Admin/Moderator only."""
    _ensure_admin(current_user)
    return reindex_status.get_snapshot()


# ── Study material upload ─────────────────────────────────────────────────────

_ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}
_MAX_FILE_MB = 50


@router.post("/admin/upload-material", status_code=202)
async def upload_material(
    file: UploadFile = File(...),
    book_name: str = Form(...),
    subject: str = Form(...),
    gs_paper: Optional[str] = Form(None),
    chapter: Optional[str] = Form(None),
    language: str = Form("en"),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a study material file (PDF, .txt, or .md) and index it for the AI layer.

    The file is chunked, embedded via Gemini, and stored in content_chunks with
    source_type='ncert'. It becomes searchable in Ask-AI and cross-linking immediately.

    Admin/Moderator only. Max file size: 50 MB.
    """
    _ensure_admin(current_user)

    # Validate file type
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Upload a PDF, .txt, or .md file.",
        )

    # Check if another upload is already running
    snap = material_status.get_snapshot()
    if snap["status"] == "running":
        raise HTTPException(
            status_code=409,
            detail="An upload is already in progress. Wait for it to finish or check /admin/upload-status.",
        )

    # Read file into a temp file (UploadFile is a stream — save before handing to thread)
    tmp_dir = tempfile.mkdtemp(prefix="upsc_material_")
    safe_name = os.path.basename(file.filename or "material").replace(" ", "_")
    tmp_path = os.path.join(tmp_dir, safe_name)

    content = await file.read()
    if len(content) > _MAX_FILE_MB * 1024 * 1024:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {_MAX_FILE_MB} MB.",
        )

    with open(tmp_path, "wb") as f_out:
        f_out.write(content)

    def _run():
        try:
            material_status.reset(file.filename or safe_name)
            material_status.append_log("info", f"Starting ingestion of '{book_name}' ({safe_name})")

            from app.services.ncert_ingestion import ingest_document
            result = ingest_document(
                file_path=tmp_path,
                book_name=book_name,
                subject=subject,
                language=language,
                gs_paper=gs_paper or None,
                chapter=chapter or None,
            )
            material_status.append_log("info", f"Done — {result['chunks_written']} chunks written.")
            material_status.complete(result)
        except Exception as exc:
            material_status.append_log("error", str(exc))
            material_status.fail(str(exc))
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)

    threading.Thread(target=_run, daemon=True, name="material-ingest").start()

    return {
        "status": "started",
        "file": file.filename,
        "message": f"'{book_name}' is being processed in the background. Poll /admin/upload-status for progress.",
    }


@router.get("/admin/upload-status")
def get_upload_status(current_user: User = Depends(get_current_user)):
    """Poll the progress of the most recent material upload. Admin/Moderator only."""
    _ensure_admin(current_user)
    return material_status.get_snapshot()


@router.get("/admin/materials")
def list_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all study materials currently indexed in the vector store.
    Groups content_chunks by (source_type='ncert', source_id) and returns
    one entry per document.
    Admin/Moderator only.
    """
    _ensure_admin(current_user)

    import json

    rows = (
        db.query(
            ContentChunk.source_id,
            ContentChunk.title,
            ContentChunk.subject,
            ContentChunk.gs_paper,
            ContentChunk.language,
            ContentChunk.metadata_json,
        )
        .filter(ContentChunk.source_type == "ncert")
        .distinct(ContentChunk.source_id)
        .order_by(ContentChunk.source_id)
        .all()
    )

    # Count chunks per source_id
    from sqlalchemy import func
    chunk_counts = dict(
        db.query(ContentChunk.source_id, func.count(ContentChunk.id))
        .filter(ContentChunk.source_type == "ncert")
        .group_by(ContentChunk.source_id)
        .all()
    )

    materials = []
    seen = set()
    for row in rows:
        if row.source_id in seen:
            continue
        seen.add(row.source_id)
        meta = json.loads(row.metadata_json) if row.metadata_json else {}
        materials.append({
            "source_id": row.source_id,
            "title": row.title or meta.get("book", "Untitled"),
            "book_name": meta.get("book", row.title or "Untitled"),
            "chapter": meta.get("chapter"),
            "file": meta.get("file"),
            "subject": row.subject,
            "gs_paper": row.gs_paper,
            "language": row.language,
            "chunks": chunk_counts.get(row.source_id, 0),
        })

    return {"total": len(materials), "materials": materials}


@router.delete("/admin/materials/{source_id}", status_code=204)
def delete_material(
    source_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove all chunks for a study material from the vector index.
    Admin/Moderator only.
    """
    _ensure_admin(current_user)

    deleted = (
        db.query(ContentChunk)
        .filter(
            ContentChunk.source_type == "ncert",
            ContentChunk.source_id == source_id,
        )
        .delete()
    )
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Material not found in index.")
    db.commit()
