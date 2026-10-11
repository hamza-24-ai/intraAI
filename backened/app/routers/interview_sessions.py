import uuid
import os 

from fastapi import HTTPException, Depends, status, APIRouter
from app.models.interview_sessions import Interview_Session
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.agent.question_generator_agent import question_generator_agent
from app.cores.auth_dependancy import get_db_user,get_optional_db_user
from app.schemas.interview_session import InterviewType,interviewResponse,DifficultyLevel,statusUpdate
from app.cores.database import get_db

from app.routers.live_sessions import ACTIVE_SESSIONS
from app.services.resume_context import resolve_resume

from typing import List, Optional, Literal





router = APIRouter(prefix="/interview_sessions", tags=["Interview Session"])


MAX_SKILLS_PER_INTERVIEW = 4

class StartInterviewRequest(BaseModel):
    interview_type : InterviewType
    difficulty_level : DifficultyLevel
    duration_type : Literal[15,30]
    resume_id : Optional[int] = None
    skills : Optional[List[str]] = None
    target_role : Optional[str] = None


@router.post("/create", status_code=201)
def start_interview(
    payload = StartInterviewRequest,
    db : Session = Depends(get_db),
    db_user = Depends(get_optional_db_user)
):

    skills, target_role, resume_id = resolve_resume(
        db, db_user, payload.skills, payload.target_role, payload.resume_id
    )

    skills = skills[:MAX_SKILLS_PER_INTERVIEW]

    if payload.interview_type.value == "behavioral":
        skills = ["Behavioral and situational"]

    
    gen = question_generator_agent({
        "skills": skills,
        "target_role": target_role,
        "difficulty_level": payload.difficulty_level.value,
    })

    if gen.get("error"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=gen["error"]
        )

    session_id = None
    if db_user:

        row = Interview_Session(
            user_id = db_user.id,
            resume_id = resume_id,
            mode = "live_interview",
            interview_type = payload.interview_type.value,
            difficulty_level = payload.difficulty_level.value,
            duration_minutes = payload.duration_type,
            status = "in_progress"
        )

        db.add(row)
        db.commit()
        db.refresh(row)

        session_id = row.id

    session_key = uuid.uuid4().hex
    question_sets = gen["question_sets"]
    ACTIVE_SESSIONS[session_key] = {
        "user_id": db_user.id if db_user else None,  # Agent_Pipeline mein Optional[int] hai
        "db_session_id": session_id,             # DB relation ke liye zaroori extra key
        "skills": skills,
        "target_role": target_role or "Software Engineer",
        "interveiw_type": payload.interview_type.value,  # Agent_Pipeline ki spelling ('interveiw_type') ke mutabiq
        "difficulty_level": payload.difficulty_level.value,
        "duration_minutes": payload.duration_minutes,
        "question_sets": question_sets,
        "skill_index": 0,
        "current_skill": question_sets[0]["skill"],
        "asked_questions": [],
        "questions_asked_count": 0,
        "all_evaluation": [],                        # Agent_Pipeline mein singular ('all_evaluation') hai
        "reach_count_current_question": 0,          # Agent_Pipeline ke naam ke mutabiq
        "session_start_timestamp": None,
        "interview_ended": False,
        "is_interview_ended": False,                 # Agent_Pipeline field
        "end_reason": None,
        "next_action": "start",
        "error": None,
        "was_skipped": False,                        # Agent_Pipeline field
        "needs_manual_role_input": False,            # Agent_Pipeline field
    }

    return {
        "session_key": session_key,
        "db_session_id": session_id,
        "ws_path": f"/ws/interview/{session_key}",
    }


def get_owned_session(db : Session,session_id, db_user) -> Interview_Session:

    session = (
        db.query(Interview_Session).filter(Interview_Session.id == session_id, Interview_Session.user_id == db_user.id).first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found from interview session"
        )
    return session


@router.get("/", response_model=List[interviewResponse])
def get_all_interview(
    db : Session = Depends(get_db),
    db_user = Depends(get_db_user)
):

    return (
        db.query(Interview_Session).filter(
            Interview_Session.user_id == db_user.id
        ).order_by(
            Interview_Session.started_at.desc()
        ).all()
    )


@router.get("/{session_id}", response_model=interviewResponse)
def get_session_by_id(
    session_id : int,
    db: Session = Depends(get_db),
    db_user = Depends(get_db_user)
):

    return get_owned_session(db, session_id, db_user)

@router.patch("/{session_id}", response_model=interviewResponse)
def update_session(
    session_id : int,
    payload : statusUpdate,
    db : Session = Depends(get_db),
    db_user = Depends(get_db_user)
):

    session = get_owned_session(db,session_id,db_user)

    if payload.status is not None:
        session.status = payload.status.value

    if payload.ended_at is not None:
        session.ended_at = payload.ended_at

    db.commit()
    db.refresh(session)

    return session



