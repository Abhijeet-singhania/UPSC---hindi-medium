from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, date
import pytz

from app.db.database import get_db
from app.db.models import DailyQuestion, DailyAnswer, User, Vote, UserRole
from app.schemas.daily_answer import (
    DailyQuestionCreate, DailyQuestionUpdate, DailyQuestionResponse,
    DailyAnswerCreate, DailyAnswerUpdate, DailyAnswerResponse
)
from app.constants import POINTS_DAILY_SUBMISSION, POINTS_BEST_ANSWER
from app.services.reputation_service import add_reputation, apply_upvote_reputation, award_once
from app.api.users import get_current_user

router = APIRouter()


# ==================== Daily Questions (Admin) ====================

@router.post("/questions/", response_model=DailyQuestionResponse)
def create_daily_question(
    question_data: DailyQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new daily question (Admin only)."""
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can create daily questions")
    
    tz_ist = pytz.timezone("Asia/Kolkata")
    today_ist = datetime.now(tz_ist).date()
    scheduled_date = question_data.date or today_ist
    scheduled_dt = tz_ist.localize(
        datetime.combine(scheduled_date, datetime.min.time())
    )

    should_activate = (
        question_data.is_active
        if question_data.is_active is not None
        else scheduled_date <= today_ist
    )

    if should_activate:
        db.query(DailyQuestion).filter(DailyQuestion.is_active == True).update(
            {DailyQuestion.is_active: False}
        )

    daily_question = DailyQuestion(
        title=question_data.title,
        content=question_data.content,
        subject=question_data.subject,
        word_limit=question_data.word_limit,
        marks=question_data.marks,
        model_answer=question_data.model_answer,
        date=scheduled_dt,
        is_active=should_activate,
        posted_by=current_user.id,
    )
    db.add(daily_question)
    db.commit()
    db.refresh(daily_question)

    return _format_daily_question(daily_question)


@router.get("/questions/today", response_model=DailyQuestionResponse)
def get_todays_question(db: Session = Depends(get_db)):
    """Get today's active daily question."""
    today = datetime.now(timezone.utc).date()
    question = db.query(DailyQuestion).filter(
        DailyQuestion.is_active == True
    ).order_by(DailyQuestion.date.desc()).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="No active question for today")
    
    return _format_daily_question(question)


@router.get("/questions/", response_model=List[DailyQuestionResponse])
def list_daily_questions(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """List past daily questions."""
    questions = db.query(DailyQuestion).order_by(
        DailyQuestion.date.desc()
    ).offset(skip).limit(limit).all()
    
    return [_format_daily_question(q) for q in questions]


@router.get("/questions/{question_id}", response_model=DailyQuestionResponse)
def get_daily_question(question_id: int, db: Session = Depends(get_db)):
    """Get a specific daily question."""
    question = db.query(DailyQuestion).filter(DailyQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Daily question not found")
    return _format_daily_question(question)


@router.put("/questions/{question_id}", response_model=DailyQuestionResponse)
def update_daily_question(
    question_id: int,
    question_data: DailyQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a daily question (Admin only)."""
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can update daily questions")
    
    question = db.query(DailyQuestion).filter(DailyQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Daily question not found")
    
    update_data = question_data.model_dump(exclude_unset=True)
    if update_data.get("is_active") is True:
        db.query(DailyQuestion).filter(
            DailyQuestion.id != question_id,
            DailyQuestion.is_active == True,
        ).update({DailyQuestion.is_active: False})

    for key, value in update_data.items():
        setattr(question, key, value)

    db.commit()
    db.refresh(question)
    return _format_daily_question(question)


# ==================== Daily Answers (User Submissions) ====================

@router.post("/answers/", response_model=DailyAnswerResponse)
def submit_daily_answer(
    answer_data: DailyAnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit an answer to today's daily question (requires authentication)."""
    question = db.query(DailyQuestion).filter(
        DailyQuestion.id == answer_data.daily_question_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Daily question not found")
    
    # Check if user already submitted
    existing = db.query(DailyAnswer).filter(
        DailyAnswer.daily_question_id == answer_data.daily_question_id,
        DailyAnswer.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already submitted an answer")
    
    word_count = len(answer_data.content.split())
    
    answer = DailyAnswer(
        daily_question_id=answer_data.daily_question_id,
        user_id=current_user.id,
        content=answer_data.content,
        word_count=word_count
    )
    db.add(answer)
    db.flush()

    add_reputation(db, current_user, POINTS_DAILY_SUBMISSION, "daily_submission", "daily_answer", answer.id)
    
    db.commit()
    db.refresh(answer)

    # Trigger AI scoring asynchronously (non-blocking)
    _score_answer_bg(answer.id, question, answer_data.content, current_user.preferred_language)

    return _format_daily_answer(answer)


@router.get("/questions/{question_id}/answers", response_model=List[DailyAnswerResponse])
def list_daily_answers(
    question_id: int,
    sort_by: str = Query("upvotes", enum=["upvotes", "recent"]),
    db: Session = Depends(get_db)
):
    """Get all answers for a daily question."""
    query = db.query(DailyAnswer).filter(DailyAnswer.daily_question_id == question_id)
    
    if sort_by == "upvotes":
        query = query.order_by(DailyAnswer.is_pinned.desc(), DailyAnswer.upvotes.desc())
    else:
        query = query.order_by(DailyAnswer.created_at.desc())
    
    answers = query.all()
    return [_format_daily_answer(a) for a in answers]


@router.post("/answers/{answer_id}/vote")
def vote_daily_answer(
    answer_id: int,
    value: int = Query(..., ge=-1, le=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vote on a daily answer (requires authentication)."""
    answer = db.query(DailyAnswer).filter(DailyAnswer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    existing_vote = db.query(Vote).filter(
        Vote.user_id == current_user.id,
        Vote.target_type == "daily_answer",
        Vote.target_id == answer_id
    ).first()

    old_value = existing_vote.value if existing_vote else 0

    if value == 0:
        if existing_vote:
            db.delete(existing_vote)
    elif existing_vote:
        existing_vote.value = value
    else:
        db.add(Vote(
            user_id=current_user.id,
            target_type="daily_answer",
            target_id=answer_id,
            value=value,
        ))

    if old_value == 1:
        answer.upvotes -= 1
    if value == 1:
        answer.upvotes += 1

    author = db.query(User).filter(User.id == answer.user_id).first()
    apply_upvote_reputation(db, author, old_value, value, "daily_answer", answer.id)

    db.commit()
    return {"upvotes": answer.upvotes}


@router.post("/answers/{answer_id}/pin")
def pin_daily_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Pin/mark as best answer (Admin only)."""
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can pin answers")
    
    answer = db.query(DailyAnswer).filter(DailyAnswer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    # Unpin others
    db.query(DailyAnswer).filter(
        DailyAnswer.daily_question_id == answer.daily_question_id,
        DailyAnswer.is_best_answer == True
    ).update({"is_best_answer": False, "is_pinned": False})
    
    answer.is_best_answer = True
    answer.is_pinned = True

    # Bonus reputation for best answer
    best_author = db.query(User).filter(User.id == answer.user_id).first()
    if best_author:
        award_once(
            db, best_author, POINTS_BEST_ANSWER, "best_answer", "daily_answer", answer.id
        )
    
    db.commit()
    return {"message": "Answer pinned as best", "answer_id": answer_id}


# ==================== AI Scoring ====================

_AI_SCORE_PROMPT = """You are a UPSC Mains answer evaluator. Score the following answer on 3 dimensions:

Question: {question}
Answer: {answer}

Evaluate strictly as a UPSC examiner would. Return ONLY valid JSON in this exact format:
{{
  "content": <integer 0-5>,     // Conceptual accuracy, depth, relevance
  "structure": <integer 0-3>,   // Introduction-body-conclusion, headings, flow
  "language": <integer 0-2>,    // Clarity, grammar, appropriate language use
  "feedback": "<2-3 actionable sentences>"
}}

Scoring guide:
- Content (0-5): 5=excellent coverage, all key dimensions; 3=adequate; 1=superficial
- Structure (0-3): 3=perfect UPSC format; 2=mostly structured; 1=unstructured
- Language (0-2): 2=clear and precise; 1=minor issues; 0=unclear
- Feedback: Be specific. Mention what was done well AND what to improve. Keep it constructive."""


def _score_answer_bg(answer_id: int, question: DailyQuestion, content: str, language: str = "hi") -> None:
    """Fire-and-forget: call Gemini to score a daily answer, then update the DB row."""

    def _run():
        import json as _json
        import logging as _logging
        import time as _time
        from app.config import settings as _settings

        _log = _logging.getLogger(__name__)

        if not _settings.GEMINI_API_KEY:
            return

        # Compose the scoring prompt
        q_text = f"{question.title}\n{question.content}" if question.content else question.title
        prompt = _AI_SCORE_PROMPT.format(
            question=q_text[:800],
            answer=content[:2000],
        )

        for attempt in range(1, 4):
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=_settings.GEMINI_API_KEY)
                response = client.models.generate_content(
                    model=_settings.GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        max_output_tokens=400,
                    ),
                )
                raw = (response.text or "").strip()

                # Strip markdown fences if present
                if raw.startswith("```"):
                    raw = "\n".join(raw.split("\n")[1:])
                if raw.endswith("```"):
                    raw = raw[:-3]

                scores = _json.loads(raw.strip())

                # Persist to DB
                from app.db.database import SessionLocal
                from app.db.models import DailyAnswer as _DA
                _db = SessionLocal()
                try:
                    _answer = _db.query(_DA).filter(_DA.id == answer_id).first()
                    if _answer:
                        _answer.ai_score_content = max(0, min(5, int(scores.get("content", 0))))
                        _answer.ai_score_structure = max(0, min(3, int(scores.get("structure", 0))))
                        _answer.ai_score_language = max(0, min(2, int(scores.get("language", 0))))
                        _answer.ai_feedback = scores.get("feedback", "")
                        _db.commit()
                        _log.info("AI scored answer %d: %s", answer_id, scores)
                finally:
                    _db.close()
                break

            except Exception as exc:
                err = str(exc)
                if "429" in err or "quota" in err.lower():
                    _time.sleep(5 * attempt)
                else:
                    _log.warning("AI scoring failed for answer %d (attempt %d): %s", answer_id, attempt, exc)
                    break

    import threading
    threading.Thread(target=_run, daemon=True, name=f"ai-score-{answer_id}").start()


# ==================== Helper Functions ====================

def _format_daily_question(question: DailyQuestion) -> dict:
    return {
        "id": question.id,
        "title": question.title,
        "content": question.content,
        "subject": question.subject,
        "word_limit": question.word_limit,
        "marks": question.marks,
        "model_answer": question.model_answer,
        "is_active": question.is_active,
        "date": question.date,
        "submission_count": len(question.submissions)
    }


def _format_daily_answer(answer: DailyAnswer) -> dict:
    c = answer.ai_score_content
    s = answer.ai_score_structure
    lang = answer.ai_score_language
    ai_total = (c or 0) + (s or 0) + (lang or 0) if any(v is not None for v in [c, s, lang]) else None
    return {
        "id": answer.id,
        "daily_question_id": answer.daily_question_id,
        "user_id": answer.user_id,
        "content": answer.content,
        "word_count": answer.word_count,
        "upvotes": answer.upvotes,
        "is_best_answer": answer.is_best_answer,
        "is_pinned": answer.is_pinned,
        "created_at": answer.created_at,
        "author_name": answer.author.name if answer.author else None,
        "author_reputation": answer.author.reputation if answer.author else 0,
        "ai_score_content": c,
        "ai_score_structure": s,
        "ai_score_language": lang,
        "ai_feedback": answer.ai_feedback,
        "ai_total_score": ai_total,
    }
