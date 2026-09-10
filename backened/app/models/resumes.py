from sqlalchemy import Column,Integer,String,DateTime,JSON,ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.cores.database import Base


class Resume(Base):

    __tablename__ = "resumes"


    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    file_url = Column(String)
    parsed_skills = Column(JSON)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())


    user = relationship("User", back_populates="resumes")