from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone, date, timedelta
from typing import List

from app.db.database import get_db
from app.db.models import SilentSession, SilentStreak, User
from app.schemas.silent_library import SessionStart, SessionEnd, SessionResponse, ActiveUsersResponse
from app.config import settings
from app.services.reputation_service import add_reputation
from app.services.redis_service import redis_service, LEADERBOARD_KEYS

router = APIRouter()

# In-memory active sessions for real-time tracking
# In production, use Redis for distributed state
active_sessions = {}


@router.post("/join", response_model=SessionResponse)
def join_library(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Join the silent library and start a study session."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user already has an active session
    existing = db.query(SilentSession).filter(
        SilentSession.user_id == user_id,
        SilentSession.end_time == None
    ).first()

    if existing:
        return existing

    session = SilentSession(user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)

    # Track in memory
    active_sessions[user_id] = {
        "session_id": session.id,
        "user_name": user.name,
        "start_time": session.start_time
    }

    return session


@router.post("/leave", response_model=SessionResponse)
def leave_library(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Leave the silent library and end the study session."""
    session = db.query(SilentSession).filter(
        SilentSession.user_id == user_id,
        SilentSession.end_time == None
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="No active session found")

    session.end_time = datetime.now(timezone.utc)
    duration = (session.end_time - session.start_time).total_seconds() / 60
    session.duration_minutes = int(duration)

    user = db.query(User).filter(User.id == user_id).first()

    # Add reputation points via centralized service
    points = int(duration) * settings.POINTS_PER_STUDY_MINUTE
    if points > 0:
        add_reputation(db, user, points, "study", "silent_session", session.id)

    # --- Streak Tracking ---
    today = date.today()

    # Update or create daily streak record
    daily_record = db.query(SilentStreak).filter(
        SilentStreak.user_id == user_id,
        SilentStreak.date == today
    ).first()

    if daily_record:
        daily_record.total_minutes += session.duration_minutes
        daily_record.sessions_count += 1
    else:
        daily_record = SilentStreak(
            user_id=user_id,
            date=today,
            total_minutes=session.duration_minutes,
            sessions_count=1
        )
        db.add(daily_record)

    # Update user streak
    if user.last_study_date is None:
        user.streak_days = 1
    elif user.last_study_date == today:
        pass  # Already counted today
    elif user.last_study_date == today - timedelta(days=1):
        user.streak_days += 1
    else:
        user.streak_days = 1  # Reset streak

    user.last_study_date = today

    # --- Update Redis Leaderboards ---
    try:
        redis_service.increment_leaderboard(
            LEADERBOARD_KEYS["study_daily"], user_id, session.duration_minutes
        )
        redis_service.increment_leaderboard(
            LEADERBOARD_KEYS["study_weekly"], user_id, session.duration_minutes
        )
        redis_service.increment_leaderboard(
            LEADERBOARD_KEYS["study_alltime"], user_id, session.duration_minutes
        )
    except Exception:
        pass  # Redis is optional

    db.commit()
    db.refresh(session)

    # Remove from active tracking
    active_sessions.pop(user_id, None)

    return session


@router.get("/active")
def get_active_users(db: Session = Depends(get_db)):
    """Get count and list of active users in the silent library."""
    active = db.query(SilentSession).filter(
        SilentSession.end_time == None
    ).all()

    users = []
    for session in active:
        user = db.query(User).filter(User.id == session.user_id).first()
        if user:
            users.append({
                "id": user.id,
                "name": user.name or "Anonymous",
                "study_since": session.start_time.isoformat()
            })

    return {
        "count": len(users),
        "users": users
    }


@router.get("/history/{user_id}", response_model=List[SessionResponse])
def get_user_history(
    user_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get study session history for a user."""
    sessions = db.query(SilentSession).filter(
        SilentSession.user_id == user_id
    ).order_by(SilentSession.start_time.desc()).limit(limit).all()
    return sessions


@router.get("/stats/{user_id}")
def get_study_stats(user_id: int, db: Session = Depends(get_db)):
    """Get study statistics for a user including streak info."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sessions = db.query(SilentSession).filter(
        SilentSession.user_id == user_id,
        SilentSession.end_time != None
    ).all()

    total_minutes = sum(s.duration_minutes for s in sessions)
    total_sessions = len(sessions)

    # Weekly hours
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    weekly_sessions = db.query(SilentSession).filter(
        SilentSession.user_id == user_id,
        SilentSession.end_time != None,
        SilentSession.start_time >= week_ago
    ).all()
    weekly_minutes = sum(s.duration_minutes for s in weekly_sessions)

    return {
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 1),
        "total_sessions": total_sessions,
        "average_session_minutes": round(total_minutes / max(total_sessions, 1), 1),
        "weekly_minutes": weekly_minutes,
        "weekly_hours": round(weekly_minutes / 60, 1),
        "streak_days": user.streak_days,
        "last_study_date": user.last_study_date.isoformat() if user.last_study_date else None,
    }
