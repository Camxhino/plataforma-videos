from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# --- USUARIOS ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# --- COMENTARIOS ---
class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    user_id: int
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- VIDEOS ---
class VideoResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    video_url: str
    thumbnail_url: str
    views: int
    user_id: int

    class Config:
        from_attributes = True
        