from pydantic import BaseModel, field_validator
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
    name: Optional[str] = None
    reputation: int = 0

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
    user_vote: int = 0

    @field_validator('tags', mode='before')
    @classmethod
    def extract_tag_names(cls, v):
        """Handle ORM Tag objects or plain strings."""
        if v and len(v) > 0 and hasattr(v[0], 'name'):
            return [tag.name for tag in v]
        return v or []

    class Config:
        from_attributes = True
