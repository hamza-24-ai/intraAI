from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class evaluationBase(BaseModel):

    score : Optional[float] = None
    evaluation_summary : str
    skill_gap_notes : Optional[str] = None


class EvaluationCreate(evaluationBase):
    answer_id : int


class EvaluationUpdate(BaseModel):
    score : Optional[float] = None
    evaluation_summary : Optional[str] = None
    skill_gap_notes : Optional[str] = None


class EvaluationResponse(evaluationBase):
    id : int
    answer_id : int

    class Config:
        from_attributes : True
        