from datetime import date, datetime, timezone
from typing import List, Optional
import threading

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.users import get_current_user
from app.db.database import get_db
from app.db.models import CurrentAffair, User, UserRole
from app.schemas.current_affair import (
    CurrentAffairCreate,
    CurrentAffairListResponse,
    CurrentAffairResponse,
    CurrentAffairUpdate,
)

router = APIRouter()

VALID_GS = {"GS1", "GS2", "GS3", "GS4", "Essay", "GS1+GS2", "GS1+GS3", "GS2+GS3"}
VALID_DIFFICULTIES = {"easy", "medium", "hard"}
VALID_LANGUAGES = {"hi", "en"}


def _index_affair_bg(affair_id: int) -> None:
    """Fire-and-forget: index a current affair in a daemon thread."""
    def _run():
        from app.db.database import SessionLocal
        from app.services.indexing_service import index_source
        db = SessionLocal()
        try:
            index_source(db, "affair", affair_id)
        except Exception as exc:
            db.rollback()
            import logging
            logging.getLogger(__name__).warning("Async index affair %d failed: %s", affair_id, exc)
        finally:
            db.close()

    import threading
    threading.Thread(target=_run, daemon=True, name=f"idx-affair-{affair_id}").start()


def _ensure_admin(user: User) -> None:
    if user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can perform this action")


def _filter_by_language(q, language: Optional[str]):
    """Apply content language filter. Hindi preference includes English items until HI translations exist."""
    if not language:
        return q
    if language == "hi":
        return q.filter(CurrentAffair.language.in_(["hi", "en"]))
    return q.filter(CurrentAffair.language == language)


def _public_affairs_query(db: Session):
    """Published affairs that passed UPSC relevance screening."""
    return db.query(CurrentAffair).filter(
        CurrentAffair.is_published == True,
        CurrentAffair.is_upsc_relevant == True,
    )


# ── Public endpoints ────────────────────────────────────────────────────────

@router.get("/", response_model=CurrentAffairListResponse)
def list_affairs(
    published_date: Optional[date] = None,
    gs_paper: Optional[str] = None,
    subject: Optional[str] = None,
    language: Optional[str] = Query(None, description="Filter by language (hi/en). Omit to return all."),
    skip: int = 0,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    List published current affairs.
    Filter by date, GS paper, or subject tag.
    """
    q = _public_affairs_query(db)
    q = _filter_by_language(q, language)

    if published_date:
        q = q.filter(CurrentAffair.published_date == published_date)
    if gs_paper:
        q = q.filter(CurrentAffair.gs_paper.ilike(f"%{gs_paper}%"))
    if subject:
        q = q.filter(CurrentAffair.subject_tags.ilike(f"%{subject}%"))

    total = q.count()
    items = (
        q.order_by(CurrentAffair.published_date.desc(), CurrentAffair.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    today_q = db.query(func.count(CurrentAffair.id)).filter(
        CurrentAffair.is_published == True,
        CurrentAffair.is_upsc_relevant == True,
        CurrentAffair.published_date == date.today(),
    )
    today_q = _filter_by_language(today_q, language)
    today_count = today_q.scalar() or 0

    return {"items": items, "total": total, "today_count": today_count}


@router.get("/today", response_model=List[CurrentAffairResponse])
def get_todays_affairs(
    language: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Return all published current affairs for today."""
    q = db.query(CurrentAffair).filter(
        CurrentAffair.is_published == True,
        CurrentAffair.is_upsc_relevant == True,
        CurrentAffair.published_date == date.today(),
    )
    q = _filter_by_language(q, language)
    return q.order_by(CurrentAffair.id.asc()).all()


@router.get("/archive", response_model=CurrentAffairListResponse)
def get_archive(
    year: Optional[int] = None,
    month: Optional[int] = None,
    language: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Paginated archive — filter by year and/or month."""
    q = _public_affairs_query(db)
    q = _filter_by_language(q, language)
    if year:
        q = q.filter(func.extract("year", CurrentAffair.published_date) == year)
    if month:
        q = q.filter(func.extract("month", CurrentAffair.published_date) == month)

    total = q.count()
    items = (
        q.order_by(CurrentAffair.published_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"items": items, "total": total, "today_count": 0}


@router.get("/{affair_id}", response_model=CurrentAffairResponse)
def get_affair(
    affair_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = None,
):
    """Get a single current affair by ID. Only published items are public; admins can see drafts."""
    item = db.query(CurrentAffair).filter(CurrentAffair.id == affair_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Current affair not found")
    if not item.is_published or not item.is_upsc_relevant:
        raise HTTPException(status_code=404, detail="Current affair not found")
    return item


@router.get("/admin/detail/{affair_id}", response_model=CurrentAffairResponse)
def get_affair_admin(
    affair_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get any affair (including drafts) for admin preview."""
    _ensure_admin(current_user)
    item = db.query(CurrentAffair).filter(CurrentAffair.id == affair_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Current affair not found")
    return item


# ── Admin endpoints ─────────────────────────────────────────────────────────

@router.post("/", response_model=CurrentAffairResponse)
def create_affair(
    data: CurrentAffairCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a current affair item (Admin/Moderator only)."""
    _ensure_admin(current_user)

    item = CurrentAffair(
        title=data.title,
        summary=data.summary,
        detailed_notes=data.detailed_notes,
        syllabus_links=data.syllabus_links,
        source_url=data.source_url,
        source_name=data.source_name,
        gs_paper=data.gs_paper,
        subject_tags=data.subject_tags,
        published_date=data.published_date,
        is_published=data.is_published,
        is_upsc_relevant=True,
        language=data.language,
        created_by=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Index immediately if published
    if item.is_published:
        _index_affair_bg(item.id)

    return item


@router.put("/{affair_id}", response_model=CurrentAffairResponse)
def update_affair(
    affair_id: int,
    data: CurrentAffairUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a current affair item (Admin/Moderator only)."""
    _ensure_admin(current_user)

    item = db.query(CurrentAffair).filter(CurrentAffair.id == affair_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Current affair not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data.get("is_published") and not item.is_upsc_relevant:
        raise HTTPException(
            status_code=400,
            detail="Cannot publish a current affair that is not marked UPSC-relevant.",
        )

    for key, value in update_data.items():
        setattr(item, key, value)
    item.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(item)

    # Re-index if published (handles newly-published items)
    if item.is_published:
        _index_affair_bg(item.id)

    return item


@router.delete("/{affair_id}", status_code=204)
def delete_affair(
    affair_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a current affair item (Admin only)."""
    _ensure_admin(current_user)

    item = db.query(CurrentAffair).filter(CurrentAffair.id == affair_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Current affair not found")

    db.delete(item)
    db.commit()


# ── Admin: list all (including drafts) ──────────────────────────────────────

@router.get("/admin/all")
def admin_list_all_affairs(
    is_published: Optional[bool] = None,
    is_upsc_relevant: Optional[bool] = None,
    skip: int = 0,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all current affairs (published + drafts). Admin/Moderator only."""
    _ensure_admin(current_user)
    q = db.query(CurrentAffair)
    if is_published is not None:
        q = q.filter(CurrentAffair.is_published == is_published)
    if is_upsc_relevant is not None:
        q = q.filter(CurrentAffair.is_upsc_relevant == is_upsc_relevant)
    total = q.count()
    items = q.order_by(CurrentAffair.published_date.desc(), CurrentAffair.id.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total}


# ── Admin: manual job triggers ───────────────────────────────────────────────

@router.post("/admin/trigger-ingestion", status_code=202)
def trigger_ingestion(current_user: User = Depends(get_current_user)):
    """
    Manually kick off the RSS + Gemini current-affairs ingestion pipeline.
    Runs in a background thread so the response returns immediately.
    New items land in the DB with is_published=False for your review.
    Admin/Moderator only.
    """
    _ensure_admin(current_user)

    from app.services import ca_ingestion_status
    from app.services.ca_ingestion import run_ingestion

    snap = ca_ingestion_status.get_snapshot()
    if snap["status"] == "running":
        raise HTTPException(
            status_code=409,
            detail="Ingestion is already running. Watch the log panel below or poll GET /admin/ingestion-status.",
        )

    def _run() -> None:
        run_ingestion(triggered_by=f"admin:{current_user.id}")

    thread = threading.Thread(target=_run, daemon=True, name="ca-ingestion")
    thread.start()

    return {
        "status": "started",
        "message": (
            "Ingestion started in the background (may take 1–3 minutes). "
            "Live progress appears in the ingestion log below and in Docker logs."
        ),
    }


@router.get("/admin/ingestion-status")
def get_ingestion_status(current_user: User = Depends(get_current_user)):
    """Live status and log lines for the CA ingestion job. Admin/Moderator only."""
    _ensure_admin(current_user)

    from app.services import ca_ingestion_status

    return ca_ingestion_status.get_snapshot()


@router.post("/admin/trigger-rotate-question", status_code=202)
def trigger_rotate_question(current_user: User = Depends(get_current_user)):
    """
    Manually rotate the daily answer-writing question.
    Useful when testing the queue or when you want to push a question early.
    Admin only.
    """
    _ensure_admin(current_user)

    from app.services.scheduler import rotate_daily_question
    thread = threading.Thread(target=rotate_daily_question, daemon=True)
    thread.start()

    return {"status": "started", "message": "Daily question rotation triggered."}


@router.get("/admin/job-status")
def get_job_status(current_user: User = Depends(get_current_user)):
    """
    Returns the next scheduled run time for every background job.
    Admin only.
    """
    _ensure_admin(current_user)

    from app.services.scheduler import _scheduler
    jobs = []
    for job in _scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else "paused",
        })
    return {"scheduler_running": _scheduler.running, "jobs": jobs}
