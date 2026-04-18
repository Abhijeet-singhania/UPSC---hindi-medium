from fastapi import APIRouter

from app.api import (
    users,
    questions,
    answers,
    silent_library,
    daily_answer,
    leaderboard,
    reports,
    past_year_problems,
)

router = APIRouter()

router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(questions.router, prefix="/questions", tags=["questions"])
router.include_router(answers.router, prefix="/answers", tags=["answers"])
router.include_router(silent_library.router, prefix="/silent-library", tags=["silent-library"])
router.include_router(daily_answer.router, prefix="/daily", tags=["daily-answer-writing"])
router.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
router.include_router(reports.router, prefix="/reports", tags=["reports"])
router.include_router(
    past_year_problems.router,
    prefix="/past-year-problems",
    tags=["past-year-problems"],
)
