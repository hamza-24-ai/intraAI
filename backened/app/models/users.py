
from sqlalchemy import Column,String,Integer,DateTime,Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.cores.database import Base


class User(Base):
    __tablename__ = "user"

    id = Column(Integer,primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String,unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False,unique=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


    resumes = relationship("Resume", back_populates="user")
    interviews = relationship("Interview_Session", back_populates="user")