from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class CurrentAffairBase(BaseModel):
    title: str
    summary: str
    detailed_notes: Optional[str] = None
    syllabus_links: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    gs_paper: Optional[str] = None          # GS1/GS2/GS3/GS4/Essay
    subject_tags: Optional[str] = None      # comma-separated string
    published_date: date
    is_published: bool = False
    language: str = "hi"


class CurrentAffairCreate(CurrentAffairBase):
    pass


class CurrentAffairUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    detailed_notes: Optional[str] = None
    syllabus_links: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    gs_paper: Optional[str] = None
    subject_tags: Optional[str] = None
    published_date: Optional[date] = None
    is_published: Optional[bool] = None
    language: Optional[str] = None


class CurrentAffairResponse(CurrentAffairBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CurrentAffairListResponse(BaseModel):
    items: List[CurrentAffairResponse]
    total: int
    today_count: int
