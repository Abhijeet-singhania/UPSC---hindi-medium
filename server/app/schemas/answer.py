from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AnswerBase(BaseModel):
    content: str


class AnswerCreate(AnswerBase):
    question_id: int


class AnswerUpdate(BaseModel):
    content: Optional[str] = None


class AnswerResponse(AnswerBase):
    id: int
    question_id: int
    user_id: int
    is_accepted: bool
    upvotes: int
    downvotes: int
    created_at: datetime

    class Config:
        from_attributes = True
