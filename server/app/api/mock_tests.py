from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import MockTestAttempt, User
from app.schemas.mock_test import MockTestSubmit, MockTestSubmitResponse, MockTestAttemptResponse
from app.constants import POINTS_MOCK_TEST_MAX, FLAWLESS_MIN_QUESTIONS
from app.services.reputation_service import add_reputation
from app.api.users import get_current_user

router = APIRouter()


def _calc_mock_points(percentage: int) -> int:
    """Award 1–50 XP based on accuracy."""
    if percentage <= 0:
        return 1
    return max(1, min(POINTS_MOCK_TEST_MAX, round(percentage / 2)))


@router.post("/submit", response_model=MockTestSubmitResponse)
def submit_mock_test(
    payload: MockTestSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a mock test attempt and award reputation points."""
    points = _calc_mock_points(payload.percentage)

    attempt = MockTestAttempt(
        user_id=current_user.id,
        exam_type=payload.exam_type,
        source=payload.source,
        total_questions=payload.total_questions,
        correct_count=payload.correct_count,
        wrong_count=payload.wrong_count,
        unattempted_count=payload.unattempted_count,
        score=payload.score,
        percentage=payload.percentage,
        time_used_seconds=payload.time_used_seconds,
        points_awarded=points,
    )
    db.add(attempt)
    db.flush()

    add_reputation(
        db, current_user, points, "mock_test", "mock_test_attempt", attempt.id
    )
    db.commit()
    db.refresh(attempt)

    flawless = (
        payload.percentage == 100
        and payload.total_questions >= FLAWLESS_MIN_QUESTIONS
    )

    return MockTestSubmitResponse(
        attempt=MockTestAttemptResponse.model_validate(attempt),
        points_awarded=points,
        flawless=flawless,
    )
