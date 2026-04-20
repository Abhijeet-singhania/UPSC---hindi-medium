from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int

    class Config:
        from_attributes = True


class QuestionBase(BaseModel):
    title: str
    content: str
    is_anonymous: bool = False


class QuestionCreate(QuestionBase):
    tags: Optional[List[str]] = []


class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_solved: Optional[bool] = None


class AuthorInfo(BaseModel):
    id: int
    name: Optional[str]
    reputation: int

    class Config:
        from_attributes = True


class QuestionResponse(QuestionBase):
    id: int
    user_id: int
    is_solved: bool
    upvotes: int
    downvotes: int
    created_at: datetime
    author: Optional[AuthorInfo] = None
    tags: List[str] = []
    answer_count: int = 0

    class Config:
        from_attributes = True
