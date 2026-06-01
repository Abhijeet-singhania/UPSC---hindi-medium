from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class MockTestSubmit(BaseModel):
    exam_type: str = Field(..., pattern="^(prelims|mains)$")
    source: str = Field(..., pattern="^(pyq|quiz-bank)$")
    total_questions: int = Field(..., ge=1)
    correct_count: int = Field(..., ge=0)
    wrong_count: int = Field(..., ge=0)
    unattempted_count: int = Field(..., ge=0)
    score: float = Field(..., ge=0)
    percentage: int = Field(..., ge=0, le=100)
    time_used_seconds: int = Field(..., ge=0)


class MockTestAttemptResponse(BaseModel):
    id: int
    exam_type: str
    source: str
    total_questions: int
    correct_count: int
    wrong_count: int
    unattempted_count: int
    score: float
    percentage: int
    time_used_seconds: int
    points_awarded: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MockTestSubmitResponse(BaseModel):
    attempt: MockTestAttemptResponse
    points_awarded: int
    flawless: bool
