from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReputationLogResponse(BaseModel):
    id: int
    user_id: int
    points: int
    reason: str
    source_type: Optional[str]
    source_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class ReputationSummary(BaseModel):
    total_reputation: int
    level: str
    next_level: Optional[str]
    points_to_next_level: int
    recent_logs: list = []
