from sqlalchemy import Column,String,DateTime,Integer, ForeignKey, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.cores.database import Base


class Evaluation(Base):

    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("answers.id"), nullable=False)
    score = Column(Float, nullable=True)
    evaluation_summary = Column(Text)
    skill_gap_notes = Column(String , nullable=True)

    evaluation = relationship("Answer", back_populates="evaluation")

    