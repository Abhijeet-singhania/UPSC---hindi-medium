from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date


class UserBase(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    exam_stage: Optional[str] = "beginner"
    optional_subject: Optional[str] = None


class UserCreate(UserBase):
    email: EmailStr
    password: str
    device_id: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(UserBase):
    password: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserResponse(UserBase):
    id: int
    device_id: Optional[str] = None
    role: str
    reputation: int
    wallet_balance: int
    streak_days: int = 0
    last_study_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True
