from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.users import get_current_user
from app.db.database import get_db
from app.db.models import QuizQuestion, User, UserRole
from app.schemas.quiz_question import (
    QuizFiltersResponse,
    QuizQuestionCreate,
    QuizQuestionResponse,
    QuizQuestionTestResponse,
    QuizQuestionUpdate,
)

router = APIRouter()

VALID_OPTIONS = {"A", "B", "C", "D"}
VALID_DIFFICULTIES = {"easy", "medium", "hard"}


def _index_quiz_bg(question_id: int) -> None:
    def _run():
        from app.db.database import SessionLocal
        from app.services.indexing_service import index_source
        db = SessionLocal()
        try:
            index_source(db, "quiz", question_id)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Async index quiz %d failed: %s", question_id, exc)
        finally:
            db.close()

    import threading
    threading.Thread(target=_run, daemon=True, name=f"idx-quiz-{question_id}").start()


def _ensure_admin(user: User) -> None:
    if user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can perform this action")


def _validate_option(opt: Optional[str]) -> None:
    if opt and opt.upper() not in VALID_OPTIONS:
        raise HTTPException(status_code=400, detail="correct_option must be A, B, C, or D")


# ── Public / user endpoints ─────────────────────────────────────────────────

@router.get("/filters", response_model=QuizFiltersResponse)
def get_quiz_filters(
    language: str = Query("hi"),
    db: Session = Depends(get_db),
):
    """Return distinct subjects, topics, and difficulties for filter dropdowns."""
    base = db.query(QuizQuestion).filter(
        QuizQuestion.is_approved == True,
        QuizQuestion.language == language,
    )
    subjects = [
        r[0] for r in base.with_entities(QuizQuestion.subject).distinct().order_by(QuizQuestion.subject).all()
        if r[0]
    ]
    topics = [
        r[0] for r in base.with_entities(QuizQuestion.topic).distinct().order_by(QuizQuestion.topic).all()
        if r[0]
    ]
    difficulties = [
        r[0] for r in base.with_entities(QuizQuestion.difficulty).distinct().order_by(QuizQuestion.difficulty).all()
        if r[0]
    ]
    return {"subjects": subjects, "topics": topics, "difficulties": difficulties}


@router.get("/review", response_model=List[QuizQuestionResponse])
def review_quiz_questions(
    ids: str = Query(..., description="Comma-separated question IDs"),
    db: Session = Depends(get_db),
):
    """Return full quiz questions (with answers) for post-test review."""
    id_list = [int(x.strip()) for x in ids.split(",") if x.strip().isdigit()]
    if not id_list:
        raise HTTPException(status_code=400, detail="At least one valid ID required")

    items = db.query(QuizQuestion).filter(QuizQuestion.id.in_(id_list)).all()
    order = {qid: idx for idx, qid in enumerate(id_list)}
    items.sort(key=lambda q: order.get(q.id, len(id_list)))
    return items


@router.get("/")
def list_quiz_questions(
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    current_affair_id: Optional[int] = None,
    language: str = Query("hi"),
    skip: int = 0,
    limit: int = Query(20, ge=1, le=100),
    for_test: bool = Query(False, description="Strip answers for mock test mode"),
    db: Session = Depends(get_db),
):
    """
    List approved quiz questions.
    Filter by subject, topic, difficulty, or linked current affair.
    """
    q = db.query(QuizQuestion).filter(
        QuizQuestion.is_approved == True,
        QuizQuestion.language == language,
    )
    if subject:
        q = q.filter(QuizQuestion.subject.ilike(f"%{subject}%"))
    if topic:
        q = q.filter(QuizQuestion.topic.ilike(f"%{topic}%"))
    if difficulty:
        if difficulty not in VALID_DIFFICULTIES:
            raise HTTPException(status_code=400, detail="difficulty must be easy, medium, or hard")
        q = q.filter(QuizQuestion.difficulty == difficulty)
    if current_affair_id:
        q = q.filter(QuizQuestion.current_affair_id == current_affair_id)

    items = q.order_by(QuizQuestion.id.asc()).offset(skip).limit(limit).all()
    if for_test:
        return [QuizQuestionTestResponse.model_validate(item) for item in items]
    return items


@router.get("/{question_id}", response_model=QuizQuestionResponse)
def get_quiz_question(question_id: int, db: Session = Depends(get_db)):
    """Get a single quiz question by ID."""
    item = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Quiz question not found")
    return item


# ── Admin: list all (including unapproved) ──────────────────────────────────

@router.get("/admin/all")
def admin_list_all_quiz_questions(
    is_approved: Optional[bool] = None,
    skip: int = 0,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all quiz questions including unapproved. Admin/Moderator only."""
    _ensure_admin(current_user)
    q = db.query(QuizQuestion)
    if is_approved is not None:
        q = q.filter(QuizQuestion.is_approved == is_approved)
    total = q.count()
    items = q.order_by(QuizQuestion.id.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total}


# ── Admin endpoints ─────────────────────────────────────────────────────────

@router.post("/", response_model=QuizQuestionResponse)
def create_quiz_question(
    data: QuizQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a quiz question (Admin/Moderator only)."""
    _ensure_admin(current_user)
    _validate_option(data.correct_option)

    item = QuizQuestion(
        subject=data.subject,
        topic=data.topic,
        difficulty=data.difficulty,
        question_text=data.question_text,
        option_a=data.option_a,
        option_b=data.option_b,
        option_c=data.option_c,
        option_d=data.option_d,
        correct_option=data.correct_option.upper(),
        explanation=data.explanation,
        source=data.source,
        current_affair_id=data.current_affair_id,
        language=data.language,
        is_approved=data.is_approved,
        created_by=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    if item.is_approved:
        _index_quiz_bg(item.id)
    return item


@router.put("/{question_id}", response_model=QuizQuestionResponse)
def update_quiz_question(
    question_id: int,
    data: QuizQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a quiz question (Admin/Moderator only)."""
    _ensure_admin(current_user)

    item = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Quiz question not found")

    update_data = data.model_dump(exclude_unset=True)
    if "correct_option" in update_data and update_data["correct_option"]:
        _validate_option(update_data["correct_option"])
        update_data["correct_option"] = update_data["correct_option"].upper()

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    if item.is_approved:
        _index_quiz_bg(item.id)
    return item


@router.delete("/{question_id}", status_code=204)
def delete_quiz_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a quiz question (Admin only)."""
    _ensure_admin(current_user)

    item = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Quiz question not found")

    db.delete(item)
    db.commit()
