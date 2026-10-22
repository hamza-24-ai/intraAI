from fastapi import FastAPI
from app.cores.database import engine,Base
from fastapi.middleware.cors import CORSMiddleware



# Import all tables from models 
from app.models.users import User
from app.models.resumes import Resume
from app.models.questions import Question
from app.models.interview_sessions import Interview_Session
from app.models.feedback_reports import FeedBack_Report
from app.models.evaluations import Evaluation
from app.models.answers import Answer

# Import all Routers 
from app.routers import auth, resumes, questions, interview_sessions, live_interview, feedback


app = FastAPI(title="IntraAI => MockUp Interview MultiAgent")


# Create tables in supabase

Base.metadata.create_all(bind=engine)

# Making routers workAble

app.include_router(auth.router)
app.include_router(resumes.router)
app.include_router(questions.router)
app.include_router(interview_sessions.router)
app.include_router(live_interview.router)
app.include_router(feedback.router)

# Connect with frontened through cors 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Return API 

@app.get("/")
def root():
    return{
        "message" : "IntraAI MultiAgent WorkFlow API is running Successfully"
    }