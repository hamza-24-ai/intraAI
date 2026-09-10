from sqlalchemy import Column,Integer,String,DateTime,ForeignKey, Enum, Float, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.cores.database import Base


class FeedBack_Report(Base):

    __tablename__ = "feedback_reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_session.id"), nullable=False)
    overall_score = Column(Float, nullable=True)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    improvement_suggestions = Column(Text, nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())


    feedback = relationship("Interview_Session", back_populates="feedback")
