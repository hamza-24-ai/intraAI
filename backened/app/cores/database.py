
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv
import os 


# Allow to variables from env file
load_dotenv()

# DATABASE URL
DATABASE_URL = os.getenv("DATABASE_URL")

# making create engine and session local for database

engine = create_engine(DATABASE_URL)
Session_Local = sessionmaker(autoflush=False, autocommit=False, bind=engine)

# Create Base for sharing tables in database
Base = declarative_base()

# make function of this creating tables

def get_db():
    db = Session_Local()

    try:
        yield db
    finally:
        db.close()
        
