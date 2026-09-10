from sqlalchemy import Column,Integer,String,DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.cores.database import Base

import enum

import datetime

# Declare Enum classes to store correct data in database

class SessionMode(str, enum.Enum):
    question_bank = "question_bank"
    live_interview = "live_interview"


class InterviewType(str, enum.Enum):
    technical = "technical"
    behavioral = "behavioral"

class DifficultyLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    technical = "technical"
    deep = "deep"

class Status(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"



class Interview_Session(Base):

    __tablename__ = "interview_session"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)

    mode = Column(Enum(SessionMode, name="session_mode"), nullable=False)
    interview_type = Column(Enum(InterviewType, name="interview_type"), nullable=False)
    difficulty_level = Column(Enum(DifficultyLevel, name="difficulty_level"), nullable=False)
    duration_minutes = Column(Integer)
    status = Column(Enum(Status, name="status", default=Status.in_progress), nullable=False)

    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)


    user = relationship("User", back_populates="interviews")
    resume = relationship("Resume", back_populates="interviews")





