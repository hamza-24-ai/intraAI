from fastapi import FastAPI
from app.cores.database import engine,Base



# Import all tables from models 
from app.models.users import User
from app.models.resumes import Resume
from app.models.questions import Question
from app.models.interview_sessions import Interview_Session
from app.models.feedback_reports import FeedBack_Report
from app.models.evaluations import Evaluation
from app.models.answers import Answer



app = FastAPI(title="IntraAI => MockUp Interview MultiAgent")


# Create tables in supabase

Base.metadata.create_all(bind=engine)


# Return API 

@app.get("/")
def root():
    return{
        "message" : "IntraAI MultiAgent WorkFlow API is running Successfully"
    }