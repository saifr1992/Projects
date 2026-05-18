from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ChatSendRequest(BaseModel):
    content: str
    session_id: Optional[int] = None
    paper_id: Optional[int] = None  # optional: ground the answer in a paper


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionOut(BaseModel):
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionDetail(ChatSessionOut):
    messages: List[ChatMessageOut] = []


class ChatSendResponse(BaseModel):
    session_id: int
    user_message: ChatMessageOut
    assistant_message: ChatMessageOut
