from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class CitationOut(BaseModel):
    index: int
    source_type: str
    source_id: int
    title: str
    gs_paper: Optional[str] = None
    subject: Optional[str] = None


class ChatSessionSummary(BaseModel):
    id: int
    title: str
    language: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    message_count: int = 0

    model_config = {"from_attributes": True}


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    citations: List[CitationOut] = []
    retrieved_chunks: Optional[int] = None
    blocked: bool = False
    error: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionDetail(BaseModel):
    id: int
    title: str
    language: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: List[ChatMessageOut]


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New chat"
    language: Optional[str] = "hi"


class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
