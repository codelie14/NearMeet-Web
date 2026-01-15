"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any


# User Schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)


class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime
    last_seen: datetime
    is_online: bool

    class Config:
        from_attributes = True


# Channel Schemas
class ChannelCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    user_id: int


class ChannelResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


# Message Schemas
class MessageCreate(BaseModel):
    channel_id: int
    content: str
    message_type: str = "text"
    file_id: Optional[int] = None


class MessageResponse(BaseModel):
    id: int
    user_id: int
    channel_id: int
    content: str
    message_type: str
    file_id: Optional[int]
    created_at: datetime
    username: Optional[str] = None

    class Config:
        from_attributes = True


# File Schemas
class FileResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    size: int
    mime_type: str
    uploaded_by: int
    created_at: datetime

    class Config:
        from_attributes = True


# WebSocket Message Schemas
class WSMessage(BaseModel):
    type: str  # message, user_joined, user_left, typing, call_signal
    data: Any
    user_id: Optional[int] = None
    username: Optional[str] = None
    timestamp: Optional[datetime] = None


# WebRTC Signaling Schemas
class WebRTCSignal(BaseModel):
    type: str  # offer, answer, ice_candidate
    room_id: str
    from_user: str
    to_user: Optional[str] = None
    data: Any
