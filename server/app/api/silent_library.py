import asyncio
import json
import logging
from datetime import datetime, timezone, date, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db, SessionLocal
from app.db.models import SilentSession, SilentStreak, User
from app.schemas.silent_library import SessionResponse
from app.services.streak_service import effective_streak_days, repair_user_streak
from app.services.reputation_service import add_reputation
from app.services.redis_service import redis_service, LEADERBOARD_KEYS, PRESENCE_CHANNEL
from app.constants import POINTS_PER_STUDY_MINUTE
from app.api.users import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_active_snapshot(db: Session) -> dict:
    """Read active users from Redis; fall back to DB if Redis is unavailable."""
    try:
        return redis_service.get_active_room()
    except Exception:
        logger.warning("Redis unavailable for presence — falling back to DB")
        return _get_active_from_db(db)


def _get_active_from_db(db: Session) -> dict:
    active = db.query(SilentSession).filter(SilentSession.end_time.is_(None)).all()
    users = []
    for session in active:
        user = db.query(User).filter(User.id == session.user_id).first()
        if user:
            users.append({
                "id": user.id,
                "name": user.name or "Anonymous",
                "study_since": session.start_time.isoformat(),
            })
    return {"count": len(users), "users": users}


def _register_presence(db: Session, user: User, session: SilentSession) -> None:
    try:
        redis_service.join_active_room(
            user.id,
            user.name or "Anonymous",
            session.id,
            session.start_time.isoformat(),
        )
    except Exception:
        logger.warning("Could not register presence in Redis for user %s", user.id)


def _unregister_presence(user_id: int) -> None:
    try:
        redis_service.leave_active_room(user_id)
    except Exception:
        logger.warning("Could not unregister presence in Redis for user %s", user_id)


def sync_active_room_from_db() -> None:
    """Rebuild Redis presence from open DB sessions (startup / recovery)."""
    db = SessionLocal()
    try:
        open_sessions = db.query(SilentSession).filter(
            SilentSession.end_time.is_(None)
        ).all()
        try:
            redis_service.clear_active_room()
            for session in open_sessions:
                user = db.query(User).filter(User.id == session.user_id).first()
                if user:
                    redis_service.join_active_room(
                        user.id,
                        user.name or "Anonymous",
                        session.id,
                        session.start_time.isoformat(),
                        publish=False,
                    )
            if open_sessions:
                try:
                    redis_service.redis.publish(PRESENCE_CHANNEL, "update")
                except Exception:
                    pass
            logger.info("Synced %d active focus sessions to Redis", len(open_sessions))
        except Exception:
            logger.warning("Could not sync active room to Redis")
    finally:
        db.close()


@router.post("/join", response_model=SessionResponse)
def join_library(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Join the silent library and start a study session (requires authentication)."""
    existing = db.query(SilentSession).filter(
        SilentSession.user_id == current_user.id,
        SilentSession.end_time == None
    ).first()

    if existing:
        _register_presence(db, current_user, existing)
        return existing

    session = SilentSession(user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)

    _register_presence(db, current_user, session)
    return session


@router.post("/leave", response_model=SessionResponse)
def leave_library(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Leave the silent library and end the study session (requires authentication)."""
    session = db.query(SilentSession).filter(
        SilentSession.user_id == current_user.id,
        SilentSession.end_time == None
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="No active session found")

    session.end_time = datetime.now(timezone.utc)
    duration = (session.end_time - session.start_time).total_seconds() / 60
    session.duration_minutes = int(duration)

    points = int(duration) * POINTS_PER_STUDY_MINUTE
    if points > 0:
        add_reputation(db, current_user, points, "study", "silent_session", session.id)

    today = date.today()

    daily_record = db.query(SilentStreak).filter(
        SilentStreak.user_id == current_user.id,
        SilentStreak.date == today
    ).first()

    if daily_record:
        daily_record.total_minutes += session.duration_minutes
        daily_record.sessions_count += 1
    else:
        daily_record = SilentStreak(
            user_id=current_user.id,
            date=today,
            total_minutes=session.duration_minutes,
            sessions_count=1
        )
        db.add(daily_record)

    if current_user.last_study_date is None:
        current_user.streak_days = 1
    elif current_user.last_study_date == today:
        if (current_user.streak_days or 0) < 1:
            current_user.streak_days = 1
    elif current_user.last_study_date == today - timedelta(days=1):
        current_user.streak_days += 1
    else:
        current_user.streak_days = 1

    current_user.last_study_date = today

    try:
        redis_service.increment_leaderboard(
            LEADERBOARD_KEYS["study_daily"], current_user.id, session.duration_minutes
        )
        redis_service.increment_leaderboard(
            LEADERBOARD_KEYS["study_weekly"], current_user.id, session.duration_minutes
        )
        redis_service.increment_leaderboard(
            LEADERBOARD_KEYS["study_alltime"], current_user.id, session.duration_minutes
        )
    except Exception:
        pass

    db.commit()
    db.refresh(session)

    _unregister_presence(current_user.id)
    return session


@router.get("/active")
def get_active_users(db: Session = Depends(get_db)):
    """Get count and list of active users (Redis-backed, DB fallback)."""
    return _get_active_snapshot(db)


@router.get("/active/stream")
async def stream_active_users():
    """
    Server-Sent Events stream for live focus-room presence.
    Pushes an update whenever someone joins or leaves (via Redis pub/sub).
    """
    async def event_generator():
        db = SessionLocal()
        pubsub = None
        try:
            snapshot = _get_active_snapshot(db)
            yield f"data: {json.dumps(snapshot)}\n\n"

            try:
                pubsub = redis_service.subscribe_presence()
            except Exception:
                pubsub = None

            if pubsub is None:
                while True:
                    await asyncio.sleep(10)
                    db.expire_all()
                    yield f"data: {json.dumps(_get_active_snapshot(db))}\n\n"
                return

            while True:
                message = await asyncio.to_thread(
                    pubsub.get_message, timeout=25.0
                )
                if message is not None:
                    db.expire_all()
                    yield f"data: {json.dumps(_get_active_snapshot(db))}\n\n"
                else:
                    yield ": heartbeat\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if pubsub is not None:
                try:
                    pubsub.unsubscribe()
                    pubsub.close()
                except Exception:
                    pass
            db.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history/me", response_model=List[SessionResponse])
def get_my_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get study session history for current user."""
    sessions = db.query(SilentSession).filter(
        SilentSession.user_id == current_user.id
    ).order_by(SilentSession.start_time.desc()).limit(limit).all()
    return sessions


@router.get("/stats/me")
def get_my_study_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get study statistics for current user including streak info."""
    sessions = db.query(SilentSession).filter(
        SilentSession.user_id == current_user.id,
        SilentSession.end_time != None
    ).all()

    total_minutes = sum(s.duration_minutes for s in sessions)
    total_sessions = len(sessions)

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    weekly_sessions = db.query(SilentSession).filter(
        SilentSession.user_id == current_user.id,
        SilentSession.end_time != None,
        SilentSession.start_time >= week_ago
    ).all()
    weekly_minutes = sum(s.duration_minutes for s in weekly_sessions)

    repair_user_streak(db, current_user)
    return {
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 1),
        "total_sessions": total_sessions,
        "average_session_minutes": round(total_minutes / max(total_sessions, 1), 1),
        "weekly_minutes": weekly_minutes,
        "weekly_hours": round(weekly_minutes / 60, 1),
        "streak_days": effective_streak_days(current_user, db),
        "last_study_date": current_user.last_study_date.isoformat() if current_user.last_study_date else None,
    }


@router.get("/history/{user_id}", response_model=List[SessionResponse])
def get_user_history(
    user_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get study session history for a user (Public)."""
    sessions = db.query(SilentSession).filter(
        SilentSession.user_id == user_id
    ).order_by(SilentSession.start_time.desc()).limit(limit).all()
    return sessions
