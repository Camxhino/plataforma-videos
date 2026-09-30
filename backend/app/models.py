from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    videos = relationship("Video", back_populates="owner")
    comments = relationship("Comment", back_populates="user")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    video_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=False)
    views = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="videos")
    comments = relationship("Comment", back_populates="video")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))

    user = relationship("User", back_populates="comments")
    video = relationship("Video", back_populates="comments")