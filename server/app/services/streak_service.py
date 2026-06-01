"""Study streak helpers — display and repair inconsistent streak state."""

from datetime import date

from sqlalchemy.orm import Session

from app.db.models import User, SilentStreak


def effective_streak_days(user: User, db: Session | None = None) -> int:
    """
    Return streak for display. If the user studied today, show at least 1 day
    even when streak_days was not persisted correctly.
    """
    stored = user.streak_days or 0
    today = date.today()

    if user.last_study_date == today:
        return max(stored, 1)

    if db is not None:
        studied_today = (
            db.query(SilentStreak.id)
            .filter(SilentStreak.user_id == user.id, SilentStreak.date == today)
            .first()
        )
        if studied_today:
            return max(stored, 1)

    return stored


def repair_user_streak(db: Session, user: User) -> bool:
    """Persist streak_days=1 when last_study_date is today but streak is still 0."""
    today = date.today()
    if user.last_study_date == today and (user.streak_days or 0) < 1:
        user.streak_days = 1
        db.commit()
        db.refresh(user)
        return True
    return False
