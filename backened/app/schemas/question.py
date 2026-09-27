from pydantic import BaseModel 
from datetime import datetime
from typing import Optional
import enum


class QuestionTypeSchema(str, enum.Enum):
    technical = "technical"
    behavioral = "behavioral"


class QuestionDifficultySchema(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    technical = "technical"
    deep = "deep"


class QuestionBase(BaseModel):
    skill: str
    question_text: str
    question_type: QuestionTypeSchema
    difficulty_level: QuestionDifficultySchema
    order_index: int


class QuestionCreate(QuestionBase):
    session_id: int


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    order_index: Optional[int] = None


class QuestionResponse(QuestionBase):

    id: int
    session_id: int

    class Config:
        from_attributes : True
