from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReportCreate(BaseModel):
    target_type: str  # 'question', 'answer', 'daily_answer', 'user'
    target_id: int
    reason: str  # 'spam', 'abuse', 'inappropriate', 'plagiarism', 'other'
    description: Optional[str] = None


class ReportStatusUpdate(BaseModel):
    status: str  # 'reviewed', 'resolved', 'dismissed'


class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    target_type: str
    target_id: int
    reason: str
    description: Optional[str]
    status: str
    reviewed_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
