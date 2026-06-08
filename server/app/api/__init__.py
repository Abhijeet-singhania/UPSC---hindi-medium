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
    affairs,
    quiz_questions,
    mock_tests,
    gamification,
    ai,
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
router.include_router(affairs.router, prefix="/affairs", tags=["current-affairs"])
router.include_router(quiz_questions.router, prefix="/quiz-questions", tags=["quiz-questions"])
router.include_router(mock_tests.router, prefix="/mock-tests", tags=["mock-tests"])
router.include_router(gamification.router, prefix="/gamification", tags=["gamification"])
router.include_router(ai.router, prefix="/ai", tags=["ai"])
