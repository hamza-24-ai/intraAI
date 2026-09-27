from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FeedbackBase(BaseModel):
    overall_score : Optional[float] = None
    strengths : Optional[str] = None
    weaknesses : Optional[str] = None
    improvement_suggestions : Optional[str] = None


class FeedbackCreate(FeedbackBase):
    session_id : int


class FeedbackUpdate(BaseModel):
    overall_score : Optional[float] = None
    strengths : Optional[str] = None
    weaknesses : Optional[str] = None
    improvement_suggestions : Optional[str] = None


class FeedbackResponse(FeedbackBase):
    id : int
    session_id : int
    generated_at : datetime

    class Config:
        from_attributes : True
        