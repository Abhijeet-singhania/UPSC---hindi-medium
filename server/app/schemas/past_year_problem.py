from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PastYearProblemBase(BaseModel):
    year: int
    exam_type: str  # prelims | mains
    paper: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    question_number: Optional[str] = None
    marks: Optional[int] = None
    word_limit: Optional[int] = None
    question_text: str
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    language: str = "hi"


class PastYearProblemCreate(PastYearProblemBase):
    pass


class PastYearProblemUpdate(BaseModel):
    year: Optional[int] = None
    exam_type: Optional[str] = None
    paper: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    question_number: Optional[str] = None
    marks: Optional[int] = None
    word_limit: Optional[int] = None
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    language: Optional[str] = None


class PastYearProblemResponse(PastYearProblemBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PastYearProblemFiltersResponse(BaseModel):
    years: List[int]
    subjects: List[str]
    papers: List[str]
    exam_types: List[str]
