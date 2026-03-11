from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import User, SilentSession
from app.services.redis_service import redis_service, LEADERBOARD_KEYS

router = APIRouter()


@router.get("/reputation")
def get_reputation_leaderboard(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get reputation leaderboard from Redis with user details."""
    board = redis_service.get_leaderboard(
        LEADERBOARD_KEYS["reputation"], 
        start=0, 
        end=limit-1
    )
    
    # Enrich with user details
    results = []
    for entry in board:
        user = db.query(User).filter(User.id == entry["user_id"]).first()
        if user:
            results.append({
                "rank": entry["rank"],
                "user_id": entry["user_id"],
                "name": user.name or "Anonymous",
                "score": entry["score"],
                "exam_stage": user.exam_stage.value if user.exam_stage else "beginner"
            })
    
    return {"leaderboard": results, "type": "reputation"}


@router.get("/study/{period}")
def get_study_leaderboard(
    period: str,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get study hours leaderboard."""
    key_map = {
        "daily": LEADERBOARD_KEYS["study_daily"],
        "weekly": LEADERBOARD_KEYS["study_weekly"],
        "alltime": LEADERBOARD_KEYS["study_alltime"]
    }
    
    if period not in key_map:
        raise HTTPException(status_code=400, detail="Invalid period. Use: daily, weekly, alltime")
    
    board = redis_service.get_leaderboard(key_map[period], start=0, end=limit-1)
    
    results = []
    for entry in board:
        user = db.query(User).filter(User.id == entry["user_id"]).first()
        if user:
            results.append({
                "rank": entry["rank"],
                "user_id": entry["user_id"],
                "name": user.name or "Anonymous",
                "study_minutes": entry["score"],
                "study_hours": round(entry["score"] / 60, 1)
            })
    
    return {"leaderboard": results, "type": f"study_{period}"}


@router.get("/user/{user_id}")
def get_user_rankings(user_id: int, db: Session = Depends(get_db)):
    """Get a user's rankings across all leaderboards."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    rankings = {
        "reputation": {
            "rank": redis_service.get_user_rank(LEADERBOARD_KEYS["reputation"], user_id),
            "score": redis_service.get_user_score(LEADERBOARD_KEYS["reputation"], user_id)
        },
        "study_daily": {
            "rank": redis_service.get_user_rank(LEADERBOARD_KEYS["study_daily"], user_id),
            "score": redis_service.get_user_score(LEADERBOARD_KEYS["study_daily"], user_id)
        },
        "study_weekly": {
            "rank": redis_service.get_user_rank(LEADERBOARD_KEYS["study_weekly"], user_id),
            "score": redis_service.get_user_score(LEADERBOARD_KEYS["study_weekly"], user_id)
        },
        "study_alltime": {
            "rank": redis_service.get_user_rank(LEADERBOARD_KEYS["study_alltime"], user_id),
            "score": redis_service.get_user_score(LEADERBOARD_KEYS["study_alltime"], user_id)
        }
    }
    
    return {
        "user_id": user_id,
        "name": user.name,
        "rankings": rankings
    }


@router.post("/sync")
def sync_leaderboards(
    user_id: int = Query(..., description="Admin User ID"),
    db: Session = Depends(get_db)
):
    """Sync all leaderboards from database to Redis (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role.value not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Only admins can sync leaderboards")
    
    # Sync reputation leaderboard
    users = db.query(User).filter(User.reputation > 0).all()
    for u in users:
        redis_service.update_leaderboard(
            LEADERBOARD_KEYS["reputation"], 
            u.id, 
            u.reputation
        )
    
    # Sync study time (alltime)
    from sqlalchemy import func
    study_totals = db.query(
        SilentSession.user_id,
        func.sum(SilentSession.duration_minutes).label("total")
    ).group_by(SilentSession.user_id).all()
    
    for user_id, total in study_totals:
        redis_service.update_leaderboard(
            LEADERBOARD_KEYS["study_alltime"],
            user_id,
            int(total or 0)
        )
    
    return {"message": "Leaderboards synced successfully"}
