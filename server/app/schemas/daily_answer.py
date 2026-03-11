from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DailyQuestionCreate(BaseModel):
    title: str
    content: str
    subject: Optional[str] = None
    word_limit: int = 250
    marks: int = 15


class DailyQuestionUpdate(BaseModel):
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

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True
