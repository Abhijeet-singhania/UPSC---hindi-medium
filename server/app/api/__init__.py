from fastapi import APIRouter

from app.api import users, questions, answers, silent_library, daily_answer, leaderboard

router = APIRouter()

router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(questions.router, prefix="/questions", tags=["questions"])
router.include_router(answers.router, prefix="/answers", tags=["answers"])
router.include_router(silent_library.router, prefix="/silent-library", tags=["silent-library"])
router.include_router(daily_answer.router, prefix="/daily", tags=["daily-answer-writing"])
router.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
