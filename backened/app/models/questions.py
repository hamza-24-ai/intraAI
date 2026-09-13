
from sqlalchemy import Column,Integer,String,DateTime,ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.cores.database import Base

import enum

class QuestionType(str, enum.Enum):
    technical = "technical"
    behavioral = "behavioral"



class Question(Base):
    __tablename__ = "questions"


    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_session.id"), nullable=False)
    skill = Column(String)
    question_text = Column(Text)
    question_type = Column(Enum(QuestionType, name="question_type_enum"))
    difficulty_level = Column(String)
    order_index = Column(String)


    question = relationship("Interview_Session", back_populates="session")
    questionss = relationship("Answer", back_populates="answer")




