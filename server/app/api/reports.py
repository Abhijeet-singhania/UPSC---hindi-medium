from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import Report, User, UserRole
from app.schemas.report import ReportCreate, ReportStatusUpdate, ReportResponse

router = APIRouter()

VALID_TARGET_TYPES = {"question", "answer", "daily_answer", "user"}
VALID_REASONS = {"spam", "abuse", "inappropriate", "plagiarism", "other"}
VALID_STATUSES = {"reviewed", "resolved", "dismissed"}


@router.post("/", response_model=ReportResponse)
def submit_report(
    report_data: ReportCreate,
    user_id: int = Query(..., description="Reporter User ID"),
    db: Session = Depends(get_db),
):
    """Submit an abuse report."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if report_data.target_type not in VALID_TARGET_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid target_type. Must be one of: {', '.join(VALID_TARGET_TYPES)}",
        )

    if report_data.reason not in VALID_REASONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid reason. Must be one of: {', '.join(VALID_REASONS)}",
        )

    # Prevent duplicate reports
    existing = db.query(Report).filter(
        Report.reporter_id == user_id,
        Report.target_type == report_data.target_type,
        Report.target_id == report_data.target_id,
        Report.status == "pending",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already reported this item")

    report = Report(
        reporter_id=user_id,
        target_type=report_data.target_type,
        target_id=report_data.target_id,
        reason=report_data.reason,
        description=report_data.description,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report


@router.get("/", response_model=List[ReportResponse])
def list_reports(
    status: str = Query("pending", description="Filter by status"),
    skip: int = 0,
    limit: int = 20,
    user_id: int = Query(..., description="Admin User ID"),
    db: Session = Depends(get_db),
):
    """List reports (Admin/Moderator only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can view reports")

    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)

    reports = (
        query.order_by(Report.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return reports


@router.put("/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: int,
    status_data: ReportStatusUpdate,
    user_id: int = Query(..., description="Admin User ID"),
    db: Session = Depends(get_db),
):
    """Update report status (Admin/Moderator only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can update reports")

    if status_data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}",
        )

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = status_data.status
    report.reviewed_by = user_id

    db.commit()
    db.refresh(report)

    return report


@router.get("/count")
def get_report_counts(
    user_id: int = Query(..., description="Admin User ID"),
    db: Session = Depends(get_db),
):
    """Get report counts by status (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can view report counts")

    pending = db.query(Report).filter(Report.status == "pending").count()
    reviewed = db.query(Report).filter(Report.status == "reviewed").count()
    resolved = db.query(Report).filter(Report.status == "resolved").count()
    dismissed = db.query(Report).filter(Report.status == "dismissed").count()

    return {
        "pending": pending,
        "reviewed": reviewed,
        "resolved": resolved,
        "dismissed": dismissed,
        "total": pending + reviewed + resolved + dismissed,
    }
