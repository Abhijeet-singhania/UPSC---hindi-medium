from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class DailyQuestionCreate(BaseModel):
    title: str
    content: str
    subject: Optional[str] = None
    word_limit: int = 250
    marks: int = 15
    model_answer: Optional[str] = None
    date: Optional[date] = None
    is_active: Optional[bool] = None


class DailyQuestionUpdate(BaseModel):
    model_config = {"protected_namespaces": ()}

    title: Optional[str] = None
    content: Optional[str] = None
    model_answer: Optional[str] = None
    is_active: Optional[bool] = None


class DailyQuestionResponse(BaseModel):
    id: int
    title: str
    content: str
    subject: Optional[str]
    word_limit: int
    marks: int
    model_answer: Optional[str]
    is_active: bool
    date: datetime
    submission_count: int = 0

    model_config = {"from_attributes": True, "protected_namespaces": ()}


class DailyAnswerCreate(BaseModel):
    daily_question_id: int
    content: str


class DailyAnswerUpdate(BaseModel):
    content: Optional[str] = None


class DailyAnswerResponse(BaseModel):
    id: int
    daily_question_id: int
    user_id: int
    content: str
    word_count: int
    upvotes: int
    is_best_answer: bool
    is_pinned: bool
    created_at: datetime
    author_name: Optional[str] = None
    author_reputation: int = 0
    # AI scoring (Phase 5) — null until Gemini has processed the submission
    ai_score_content: Optional[int] = None
    ai_score_structure: Optional[int] = None
    ai_score_language: Optional[int] = None
    ai_feedback: Optional[str] = None
    ai_total_score: Optional[int] = None  # computed: content + structure + language (max 10)

    class Config:
        from_attributes = True
