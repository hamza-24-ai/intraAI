from pydantic import BaseModel
from typing import Optional
import datetime



class answerBase(BaseModel):
    transcribed_text : Optional[str] = None
    audio_url : Optional[str] = None
    response_time_seconds : Optional[float] = None
    was_skipped : Optional[bool] = None


class CreateAnswer(answerBase):
    question_id : int


class UpdateAnswer(BaseModel):
    transcribed_text : Optional[str] = None
    audio_url : Optional[str] = None


class ResponseAnswer(answerBase):
    id : int
    question_id : int
    created_at : datetime

    class Config:
        from_attributes : True