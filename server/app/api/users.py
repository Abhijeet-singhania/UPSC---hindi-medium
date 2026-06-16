from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.db.database import get_db
from app.db.models import User, SilentSession, Answer, DailyAnswer, MockTestAttempt
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserLogin, Token, TokenData
from app.services.reputation_service import get_reputation_history, get_level
from app.services.streak_service import effective_streak_days, repair_user_streak
from app.services.auth_service import get_password_hash, verify_password, create_access_token, decode_token
from app.config import settings
from app.constants import API_V1_PREFIX, FLAWLESS_MIN_QUESTIONS

router = APIRouter()
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{API_V1_PREFIX}/users/login-form")
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl=f"{API_V1_PREFIX}/users/login-form",
    auto_error=False,
)


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    token_data = TokenData(email=email)
    
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user


async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return the authenticated user when a valid token is present, else None."""
    if not token:
        return None
    payload = decode_token(token)
    if payload is None:
        return None
    email = payload.get("sub")
    if email is None:
        return None
    return db.query(User).filter(User.email == email).first()


@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with email and password."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    hashed_pwd = get_password_hash(user_data.password)
    
    lang = (user_data.preferred_language or "hi").lower()
    if lang not in ("hi", "en"):
        lang = "hi"

    user = User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        name=user_data.name,
        device_id=user_data.device_id,
        bio=user_data.bio,
        exam_stage=user_data.exam_stage,
        optional_subject=user_data.optional_subject,
        preferred_language=lang,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("User registered id=%s email=%s", user.id, user.email)
    return user


@router.post("/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return access token."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        logger.warning("Login failed for email=%s", login_data.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    logger.info("Login success user=%s email=%s", user.id, user.email)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login-form", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """OAuth2 compatible token login, retrieve an access token for future requests."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def read_users_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current logged in user profile."""
    repair_user_streak(db, current_user)
    profile = UserResponse.model_validate(current_user)
    profile.streak_days = effective_streak_days(current_user, db)
    return profile


@router.get("/admin/users")
def admin_list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all users. Admin/Moderator only."""
    from app.db.models import UserRole as _UserRole
    if current_user.role not in [_UserRole.ADMIN, _UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Admins only")
    total = db.query(User).count()
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return {"users": users, "total": total}


@router.put("/admin/users/{user_id}/role")
def admin_set_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change a user's role. Admin only."""
    from app.db.models import UserRole as _UserRole
    if current_user.role != _UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can change roles")
    valid_roles = [r.value for r in _UserRole]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"role must be one of {valid_roles}")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.role = _UserRole(role)
    db.commit()
    db.refresh(target)
    return {"id": target.id, "email": target.email, "role": target.role.value}


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID (Public profile)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_data: UserUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    update_data = user_data.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    if "preferred_language" in update_data and update_data["preferred_language"]:
        pl = update_data["preferred_language"].lower()
        update_data["preferred_language"] = pl if pl in ("hi", "en") else "hi"

    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}/stats")
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Get user statistics."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    question_count = len(user.questions)
    answer_count = len(user.answers)
    total_study_minutes = sum(s.duration_minutes for s in user.silent_sessions)
    
    repair_user_streak(db, user)
    return {
        "reputation": user.reputation,
        "questions_asked": question_count,
        "answers_given": answer_count,
        "total_study_minutes": total_study_minutes,
        "streak_days": effective_streak_days(user, db),
        "last_study_date": user.last_study_date.isoformat() if user.last_study_date else None,
    }


@router.get("/{user_id}/reputation-summary")
def get_user_reputation_summary(user_id: int, db: Session = Depends(get_db)):
    """Get reputation summary with level and rank information."""
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


@router.get("/me/achievements")
def get_my_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return computed badge / achievement status for the current user.
    All values are derived from existing data — no separate achievements table needed.
    """
    silent_count = (
        db.query(sqlfunc.count(SilentSession.id))
        .filter(
            SilentSession.user_id == current_user.id,
            SilentSession.end_time.isnot(None),
        )
        .scalar()
        or 0
    )

    answer_count = (
        db.query(sqlfunc.count(Answer.id))
        .filter(Answer.user_id == current_user.id)
        .scalar()
        or 0
    )

    daily_count = (
        db.query(sqlfunc.count(DailyAnswer.id))
        .filter(DailyAnswer.user_id == current_user.id)
        .scalar()
        or 0
    )

    repair_user_streak(db, current_user)
    rep = current_user.reputation
    streak = effective_streak_days(current_user, db)

    mock_count = (
        db.query(sqlfunc.count(MockTestAttempt.id))
        .filter(MockTestAttempt.user_id == current_user.id)
        .scalar()
        or 0
    )

    flawless = (
        db.query(MockTestAttempt.id)
        .filter(
            MockTestAttempt.user_id == current_user.id,
            MockTestAttempt.percentage == 100,
            MockTestAttempt.total_questions >= FLAWLESS_MIN_QUESTIONS,
        )
        .first()
        is not None
    )

    return {
        "first_blood":  answer_count > 0 or daily_count > 0,
        "night_owl":    silent_count > 0,
        "streak_30":    streak >= 30,
        "streak_progress": streak,
        "scholar":      rep >= 500,
        "cabinet":      rep >= 1000,
        "flawless":     flawless,
        "mock_tests_completed": mock_count,
    }
