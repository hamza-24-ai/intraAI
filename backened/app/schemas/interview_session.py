from pydantic import BaseModel 
from datetime import datetime
from typing import Optional
import enum


class SessionMode(str, enum.Enum):
    question_bank = "question_bank"
    libe_interview = "live_interview"

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


# create session mode
class interviewSessionBase(BaseModel):
    mode : SessionMode
    interview_type : InterviewType
    difficulty_level : DifficultyLevel
    duration_minutes : int


# create interview Session

class createInterviewSession(interviewSessionBase):
    resume_id : Optional[int] = None


# Status can be updated

class statusUpdate(BaseModel):
    status : Optional[Status] = None
    ended_at : Optional[datetime] = None


class interviewResponse(interviewSessionBase):

    id : int
    user_id : int
    resume_id : int
    status : Status
    started_at : datetime
    ended_at : Optional[datetime] = None

    