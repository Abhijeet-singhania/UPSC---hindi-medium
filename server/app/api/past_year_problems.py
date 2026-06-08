from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import PastYearProblem, PastYearExamType, User, UserRole
from app.schemas.past_year_problem import (
    PastYearProblemCreate,
    PastYearProblemUpdate,
    PastYearProblemResponse,
    PastYearProblemTestResponse,
    PastYearProblemFiltersResponse,
)
from app.api.users import get_current_user

router = APIRouter()

VALID_EXAM_TYPES = {"prelims", "mains"}
VALID_OPTIONS = {"A", "B", "C", "D"}


def _index_pyq_bg(problem_id: int) -> None:
    def _run():
        from app.db.database import SessionLocal
        from app.services.indexing_service import index_source
        db = SessionLocal()
        try:
            index_source(db, "pyq", problem_id)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Async index PYQ %d failed: %s", problem_id, exc)
        finally:
            db.close()

    import threading
    threading.Thread(target=_run, daemon=True, name=f"idx-pyq-{problem_id}").start()


def _parse_exam_type(exam_type: str) -> PastYearExamType:
    if exam_type not in VALID_EXAM_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid exam_type. Must be one of: prelims, mains",
        )
    return PastYearExamType(exam_type)


def _validate_option(correct_option: Optional[str]):
    if correct_option is None:
        return
    if correct_option.upper() not in VALID_OPTIONS:
        raise HTTPException(status_code=400, detail="correct_option must be one of: A, B, C, D")


def _ensure_admin(user: User) -> None:
    if user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can perform this action")


@router.get("/review", response_model=List[PastYearProblemResponse])
def review_past_year_problems(
    ids: str = Query(..., description="Comma-separated problem IDs"),
    db: Session = Depends(get_db),
):
    """Return full problems (with answers) for post-test review."""
    id_list = [int(x.strip()) for x in ids.split(",") if x.strip().isdigit()]
    if not id_list:
        raise HTTPException(status_code=400, detail="At least one valid ID required")

    problems = (
        db.query(PastYearProblem)
        .filter(PastYearProblem.id.in_(id_list))
        .all()
    )
    order = {pid: idx for idx, pid in enumerate(id_list)}
    problems.sort(key=lambda p: order.get(p.id, len(id_list)))
    return problems


@router.get("/")
def list_past_year_problems(
    skip: int = 0,
    limit: int = Query(20, ge=1, le=100),
    year: Optional[int] = None,
    exam_type: Optional[str] = Query(None, description="prelims or mains"),
    subject: Optional[str] = None,
    paper: Optional[str] = None,
    language: Optional[str] = Query("hi", description="hi or en"),
    search: Optional[str] = Query(None, description="Search in question text"),
    for_test: bool = Query(False, description="Strip answers for mock test mode"),
    db: Session = Depends(get_db),
):
    """List past year problems with filters for year/exam/subject/paper/language."""
    query = db.query(PastYearProblem)

    if year is not None:
        query = query.filter(PastYearProblem.year == year)
    if exam_type:
        query = query.filter(PastYearProblem.exam_type == _parse_exam_type(exam_type))
    if subject:
        query = query.filter(PastYearProblem.subject.ilike(f"%{subject}%"))
    if paper:
        query = query.filter(PastYearProblem.paper.ilike(f"%{paper}%"))
    if language:
        query = query.filter(PastYearProblem.language == language)
    if search:
        query = query.filter(
            or_(
                PastYearProblem.question_text.ilike(f"%{search}%"),
                PastYearProblem.topic.ilike(f"%{search}%"),
            )
        )

    problems = (
        query.order_by(PastYearProblem.year.desc(), PastYearProblem.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    if for_test:
        return [PastYearProblemTestResponse.model_validate(p) for p in problems]
    return problems


@router.get("/filters", response_model=PastYearProblemFiltersResponse)
def get_past_year_problem_filters(
    language: Optional[str] = Query("hi"),
    db: Session = Depends(get_db),
):
    """Get available filter values to build frontend filter controls."""
    base_query = db.query(PastYearProblem)
    if language:
        base_query = base_query.filter(PastYearProblem.language == language)

    years = [
        row[0]
        for row in base_query.with_entities(PastYearProblem.year)
        .distinct()
        .order_by(PastYearProblem.year.desc())
        .all()
        if row[0] is not None
    ]
    subjects = [
        row[0]
        for row in base_query.with_entities(PastYearProblem.subject)
        .distinct()
        .order_by(PastYearProblem.subject.asc())
        .all()
        if row[0]
    ]
    papers = [
        row[0]
        for row in base_query.with_entities(PastYearProblem.paper)
        .distinct()
        .order_by(PastYearProblem.paper.asc())
        .all()
        if row[0]
    ]
    exam_types = [
        row[0].value if row[0] else None
        for row in base_query.with_entities(PastYearProblem.exam_type)
        .distinct()
        .order_by(PastYearProblem.exam_type.asc())
        .all()
        if row[0]
    ]

    return {
        "years": years,
        "subjects": subjects,
        "papers": papers,
        "exam_types": exam_types,
    }


@router.get("/{problem_id}", response_model=PastYearProblemResponse)
def get_past_year_problem(problem_id: int, db: Session = Depends(get_db)):
    """Get one past year problem by ID."""
    problem = db.query(PastYearProblem).filter(PastYearProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Past year problem not found")
    return problem


@router.post("/", response_model=PastYearProblemResponse)
def create_past_year_problem(
    problem_data: PastYearProblemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new past year problem (Admin/Moderator only)."""
    _ensure_admin(current_user)
    _validate_option(problem_data.correct_option)

    problem = PastYearProblem(
        year=problem_data.year,
        exam_type=_parse_exam_type(problem_data.exam_type),
        paper=problem_data.paper,
        subject=problem_data.subject,
        topic=problem_data.topic,
        question_number=problem_data.question_number,
        marks=problem_data.marks,
        word_limit=problem_data.word_limit,
        question_text=problem_data.question_text,
        option_a=problem_data.option_a,
        option_b=problem_data.option_b,
        option_c=problem_data.option_c,
        option_d=problem_data.option_d,
        correct_option=problem_data.correct_option.upper() if problem_data.correct_option else None,
        explanation=problem_data.explanation,
        language=problem_data.language,
        created_by=current_user.id,
    )
    db.add(problem)
    db.commit()
    db.refresh(problem)
    _index_pyq_bg(problem.id)
    return problem


@router.put("/{problem_id}", response_model=PastYearProblemResponse)
def update_past_year_problem(
    problem_id: int,
    problem_data: PastYearProblemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing past year problem (Admin/Moderator only)."""
    _ensure_admin(current_user)
    if problem_data.correct_option is not None:
        _validate_option(problem_data.correct_option)

    problem = db.query(PastYearProblem).filter(PastYearProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Past year problem not found")

    update_data = problem_data.model_dump(exclude_unset=True)
    if "exam_type" in update_data and update_data["exam_type"] is not None:
        update_data["exam_type"] = _parse_exam_type(update_data["exam_type"])
    if "correct_option" in update_data and update_data["correct_option"] is not None:
        update_data["correct_option"] = update_data["correct_option"].upper()

    for key, value in update_data.items():
        setattr(problem, key, value)

    db.commit()
    db.refresh(problem)
    _index_pyq_bg(problem.id)
    return problem
