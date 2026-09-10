from sqlalchemy import Column,Integer,String,DateTime,ForeignKey, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.cores.database import Base


class Answer(Base):

    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    transcribed_text = Column(String, nullable=True)
    audio_url = Column(String, nullable=True)
    response_time_seconds = Column(Float, nullable=True)
    was_skipped = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.utcnow())

    answer = relationship("Question", back_populates="question")

    