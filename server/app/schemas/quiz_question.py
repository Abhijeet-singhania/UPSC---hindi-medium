from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class QuizQuestionBase(BaseModel):
    subject: str
    topic: Optional[str] = None
    difficulty: str = "medium"          # easy / medium / hard
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str                 # A / B / C / D
    explanation: Optional[str] = None
    source: Optional[str] = None
    current_affair_id: Optional[int] = None
    language: str = "hi"
    is_approved: bool = False


class QuizQuestionCreate(QuizQuestionBase):
    pass


class QuizQuestionUpdate(BaseModel):
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    source: Optional[str] = None
    current_affair_id: Optional[int] = None
    language: Optional[str] = None
    is_approved: Optional[bool] = None


class QuizQuestionResponse(QuizQuestionBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QuizQuestionTestResponse(BaseModel):
    """Quiz payload for mock tests — answers withheld until review."""
    id: int
    subject: str
    topic: Optional[str] = None
    difficulty: str = "medium"
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    source: Optional[str] = None
    current_affair_id: Optional[int] = None
    language: str = "hi"
    is_approved: bool = False
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QuizFiltersResponse(BaseModel):
    subjects: List[str]
    topics: List[str]
    difficulties: List[str]
