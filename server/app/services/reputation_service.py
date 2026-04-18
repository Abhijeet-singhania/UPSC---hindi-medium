"""
Centralized Reputation & Points Engine.
All reputation changes should go through this service to ensure
consistent logging and auto-promotion.
"""

from sqlalchemy.orm import Session
from app.db.models import User, ReputationLog, UserRole
from app.config import settings
from app.services.redis_service import redis_service, LEADERBOARD_KEYS


# Level thresholds
LEVELS = [
    {"name": "Beginner", "min_points": 0},
    {"name": "Learner", "min_points": 50},
    {"name": "Contributor", "min_points": 200},
    {"name": "Scholar", "min_points": 500},
    {"name": "Mentor", "min_points": 1000},
]

# Auto-promotion thresholds (reputation -> role)
ROLE_PROMOTION_THRESHOLD = {
    UserRole.CONTRIBUTOR: 200,
}


def get_level(reputation: int) -> dict:
    """Get the user's level based on reputation points."""
    current_level = LEVELS[0]
    next_level = LEVELS[1] if len(LEVELS) > 1 else None

    for i, level in enumerate(LEVELS):
        if reputation >= level["min_points"]:
            current_level = level
            next_level = LEVELS[i + 1] if i + 1 < len(LEVELS) else None

    points_to_next = (next_level["min_points"] - reputation) if next_level else 0

    return {
        "level": current_level["name"],
        "next_level": next_level["name"] if next_level else None,
        "points_to_next_level": max(0, points_to_next),
    }


def add_reputation(
    db: Session,
    user: User,
    points: int,
    reason: str,
    source_type: str = None,
    source_id: int = None,
) -> ReputationLog:
    """
    Add reputation points to a user with full logging.

    Args:
        db: Database session
        user: The user to add points to
        points: Points to add (can be negative)
        reason: Why points are being added (e.g. 'upvote', 'answer', 'study')
        source_type: The type of entity that caused the change
        source_id: The ID of the entity that caused the change

    Returns:
        The created ReputationLog entry
    """
    # Update user reputation
    user.reputation += points

    # Create audit log
    log = ReputationLog(
        user_id=user.id,
        points=points,
        reason=reason,
        source_type=source_type,
        source_id=source_id,
    )
    db.add(log)

    # Update Redis leaderboard
    try:
        redis_service.update_leaderboard(
            LEADERBOARD_KEYS["reputation"], user.id, user.reputation
        )
    except Exception:
        pass  # Redis is optional, don't break the flow

    # Check for auto-promotion
    _check_auto_promote(user)

    return log


def _check_auto_promote(user: User):
    """Auto-promote user role based on reputation thresholds."""
    if user.role == UserRole.USER:
        threshold = ROLE_PROMOTION_THRESHOLD.get(UserRole.CONTRIBUTOR)
        if threshold and user.reputation >= threshold:
            user.role = UserRole.CONTRIBUTOR


def get_reputation_history(
    db: Session, user_id: int, limit: int = 20
) -> list:
    """Get recent reputation change history for a user."""
    logs = (
        db.query(ReputationLog)
        .filter(ReputationLog.user_id == user_id)
        .order_by(ReputationLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return logs
