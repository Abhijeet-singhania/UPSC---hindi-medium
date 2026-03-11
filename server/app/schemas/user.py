from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    exam_stage: Optional[str] = "beginner"
    optional_subject: Optional[str] = None


class UserCreate(UserBase):
    device_id: str


class UserUpdate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    device_id: str
    role: str
    reputation: int
    wallet_balance: int
    created_at: datetime

    class Config:
        from_attributes = True
