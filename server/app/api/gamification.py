from fastapi import APIRouter

from app.constants import (
    LEVELS,
    POINTS_PER_UPVOTE,
    POINTS_PER_ANSWER,
    POINTS_PER_QUESTION,
    POINTS_PER_STUDY_MINUTE,
    POINTS_BEST_ANSWER,
    POINTS_DOUBT_SOLVED,
    POINTS_DAILY_SUBMISSION,
    POINTS_MOCK_TEST_MAX,
    CONTRIBUTOR_REPUTATION_THRESHOLD,
    FLAWLESS_MIN_QUESTIONS,
)

router = APIRouter()


@router.get("/config")
def get_gamification_config():
    """Single source of truth for levels and point values (used by Rewards UI)."""
    return {
        "levels": LEVELS,
        "points": {
            "upvote": POINTS_PER_UPVOTE,
            "answer": POINTS_PER_ANSWER,
            "question": POINTS_PER_QUESTION,
            "study_minute": POINTS_PER_STUDY_MINUTE,
            "best_answer": POINTS_BEST_ANSWER,
            "doubt_solved": POINTS_DOUBT_SOLVED,
            "daily_submission": POINTS_DAILY_SUBMISSION,
            "mock_test_max": POINTS_MOCK_TEST_MAX,
        },
        "contributor_threshold": CONTRIBUTOR_REPUTATION_THRESHOLD,
        "flawless_min_questions": FLAWLESS_MIN_QUESTIONS,
    }
