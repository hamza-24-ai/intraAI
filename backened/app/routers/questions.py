from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.agent.question_generator_agent import question_generator_agent
from app.models.interview_sessions import Interview_Session
from app.models.questions import Question
from app.cores.database import get_db
from fastapi import HTTPException, status , Depends, APIRouter
from app.services.resume_context import resolve_resume
from sqlalchemy.orm import Session
from app.schemas.interview_session import DifficultyLevel
from app.cores.auth_dependancy import get_db_user,get_optional_db_user


router = APIRouter(
    prefix="/questions", tags=["Question Bank"]
)


class GenerateQuesyionRequest(BaseModel):
    resume_id : Optional[int] = None
    skills : Optional[List[str]] = None
    target_role : Optional[str] = None
    difficulty : DifficultyLevel = DifficultyLevel.technical


@router.post("/generate")
def generate_questions(
    payload = GenerateQuesyionRequest,
    db : Session = Depends(get_db),
    db_user = Depends(get_optional_db_user)
):

    skills,target_role,resume_id = resolve_resume(
        db, db_user,payload.skills, payload.target_role,payload.resume_id
    )

    state = {
        "skills" : skills,
        "target_role" : target_role,
        "difficulty_level" : payload.difficulty.value
    }

    state = question_generator_agent(state)

    if state.get("error"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error occured due to generate questions"
        )

    question_sets = state["question_sets"]
    session_id = None

    if db_user:
        session = Interview_Session(
                user_id = db_user.id,
                resume_id = resume_id,
                mode = "question_bank",
                interview_type = "technical",
                difficulty_level = payload.difficulty.value,
                duration_minutes = None,
                status = "completed",
                ended_at = datetime.utcnow()
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        order = 0

        for qs in question_sets:
            order +=1
            for q in qs["questions"]:
                db.add(
                    Question(
                        session_id = session.id,
                        skill = q["skill"],
                        question_text = q["question_text"],
                        question_type = "technical",
                        difficulty_level = payload.difficulty.value,
                        order_index = order
                    )
                )
        db.commit()
        db.refresh(Question)

        session_id = session.id

    return {
        "saved": session_id is not None,
        "session_id": session_id,
        "target_role": target_role,
        "question_sets": question_sets,
    }


@router.get("/{session_id}")
def get_session_questions(
    session_id: int,
    db: Session = Depends(get_db),
    db_user=Depends(get_db_user),
):
    session = (
        db.query(Interview_Session)
        .filter(Interview_Session.id == session_id, Interview_Session.user_id == db_user.id)
        .first()
    )
    if session is None:
        raise HTTPException(404, "Session not found.")

    questions = (
        db.query(Question)
        .filter(Question.session_id == session.id)
        .order_by(Question.order_index)
        .all()
    )

    grouped = {}
    for q in questions:
        grouped.setdefault(q.skill, []).append({
            "id": q.id,
            "question_text": q.question_text,
            "difficulty_level": getattr(q.difficulty_level, "value", q.difficulty_level),
        })
    return {"session_id": session.id, "questions_by_skill": grouped}
    