from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

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
        "total_study_minutes": total_study_minutes
    }
