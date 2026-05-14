from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AnswerBase(BaseModel):
    content: str


class AnswerCreate(AnswerBase):
    question_id: int


class AnswerUpdate(BaseModel):
    content: Optional[str] = None


class AnswerAuthorInfo(BaseModel):
    id: int
    name: Optional[str] = None
    reputation: int = 0

    class Config:
        from_attributes = True


class AnswerResponse(AnswerBase):
    id: int
    question_id: int
    user_id: int
    is_accepted: bool
    upvotes: int
    downvotes: int
    created_at: datetime
    author: Optional[AnswerAuthorInfo] = None

    class Config:
        from_attributes = True
