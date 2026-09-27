from pydantic import BaseModel 
from datetime import datetime
from typing import Optional
import enum

class ResumeBase(BaseModel):
    file_url: str


class ResumeCreate(ResumeBase):
    pass
    # user_id JWT se milega, frontend nahi bhejega


class ResumeUpdate(BaseModel):
    parsed_skills: Optional[dict] = None


class ResumeResponse(ResumeBase):

    id: int
    user_id: int
    parsed_skills: Optional[dict] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True