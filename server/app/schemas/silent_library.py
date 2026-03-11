from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SessionStart(BaseModel):
    user_id: int


class SessionEnd(BaseModel):
    session_id: int


class SessionResponse(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: int

    class Config:
        from_attributes = True


class ActiveUsersResponse(BaseModel):
    count: int
    users: list
