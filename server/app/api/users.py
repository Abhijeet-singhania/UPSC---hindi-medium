from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.reputation_service import get_reputation_history, get_level

router = APIRouter()


@router.post("/", response_model=UserResponse)
def create_or_get_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user or return existing one based on device_id."""
    existing = db.query(User).filter(User.device_id == user_data.device_id).first()
    if existing:
        return existing
    
    user = User(
        device_id=user_data.device_id,
        name=user_data.name,
        bio=user_data.bio,
        exam_stage=user_data.exam_stage,
        optional_subject=user_data.optional_subject
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/device/{device_id}", response_model=UserResponse)
def get_user_by_device(device_id: str, db: Session = Depends(get_db)):
    """Get user by device ID."""
    user = db.query(User).filter(User.device_id == device_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    """Update user profile."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user_data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}/stats")
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Get user statistics."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    question_count = len(user.questions)
    answer_count = len(user.answers)
    total_study_minutes = sum(s.duration_minutes for s in user.silent_sessions)
    
    return {
        "reputation": user.reputation,
        "questions_asked": question_count,
        "answers_given": answer_count,
        "total_study_minutes": total_study_minutes,
        "streak_days": user.streak_days,
        "last_study_date": user.last_study_date.isoformat() if user.last_study_date else None,
    }


@router.get("/{user_id}/reputation-history")
def get_user_reputation_history(
    user_id: int,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Get reputation change history for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    logs = get_reputation_history(db, user_id, limit)
    return {
        "user_id": user_id,
        "total_reputation": user.reputation,
        "logs": [
            {
                "id": log.id,
                "points": log.points,
                "reason": log.reason,
                "source_type": log.source_type,
                "source_id": log.source_id,
                "created_at": log.created_at,
            }
            for log in logs
        ],
    }


@router.get("/{user_id}/reputation-summary")
def get_user_reputation_summary(user_id: int, db: Session = Depends(get_db)):
    """Get reputation summary with level information."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    level_info = get_level(user.reputation)

    return {
        "user_id": user_id,
        "name": user.name,
        "reputation": user.reputation,
        "role": user.role.value if user.role else "user",
        **level_info,
    }
