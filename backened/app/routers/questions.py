from datetime import datetime
from typing import Optional, List
from pydantic import AliasChoices, BaseModel, Field, field_validator

from app.agent.question_generator_agent import (
    ALL_SKILLS_FAILED_MESSAGE,
    MAX_SKILLS_PER_GENERATION,
    question_generator_agent,
)
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


MAX_SELECTED_SKILLS = MAX_SKILLS_PER_GENERATION
MAX_SELECTED_SKILL_LENGTH = 64


class GenerateQuesyionRequest(BaseModel):
    resume_id : Optional[int] = None
    skills : Optional[List[str]] = None
    selected_skills : Optional[List[str]] = None
    target_role : Optional[str] = None
    difficulty_level : DifficultyLevel = Field(
        default=DifficultyLevel.intermediate,
        validation_alias=AliasChoices("difficulty_level", "difficulty"),
    )

    @field_validator("selected_skills")
    @classmethod
    def validate_selected_skills(cls, value : Optional[List[str]]):

        if value is None:
            return value

        if len(value) > MAX_SELECTED_SKILLS:
            raise ValueError(f"Select at most {MAX_SELECTED_SKILLS} skills.")

        cleaned_skills = []

        for raw_skill in value:
            skill = (raw_skill or "").strip()

            if not skill:
                raise ValueError("Selected skills cannot be empty.")

            if len(skill) > MAX_SELECTED_SKILL_LENGTH:
                raise ValueError(
                    f"Each selected skill must be {MAX_SELECTED_SKILL_LENGTH} characters or fewer."
                )

            cleaned_skills.append(skill)

        return cleaned_skills


def skill_key(skill : str) -> str:
    return " ".join(skill.casefold().split())


def apply_skill_selection(available_skills : List[str], selected_skills : List[str]) -> List[str]:
    """Keep the resume's spelling; drop selections that do not match it."""

    available = {}

    for skill in available_skills:
        if not isinstance(skill, str):
            continue

        stored_skill = skill.strip()

        if stored_skill:
            available.setdefault(skill_key(stored_skill), stored_skill)

    selected = []
    seen = set()

    for raw_skill in selected_skills:
        key = skill_key(raw_skill)
        stored_skill = available.get(key)

        if stored_skill is None or key in seen:
            continue

        seen.add(key)
        selected.append(stored_skill)

    if not selected:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="None of the selected skills match your resume. Choose skills from the list."
        )

    return selected


@router.post("/generate")
def generate_questions(
    payload : GenerateQuesyionRequest,
    db : Session = Depends(get_db),
    db_user = Depends(get_optional_db_user)
):

    skills,target_role,resume_id = resolve_resume(
        db, db_user,payload.skills, payload.target_role,payload.resume_id
    )

    if payload.selected_skills:
        skills = apply_skill_selection(skills, payload.selected_skills)

    state = {
        "skills" : skills,
        "target_role" : target_role,
        "difficulty_level" : payload.difficulty_level.value
    }

    state = question_generator_agent(state)

    if state.get("error") == ALL_SKILLS_FAILED_MESSAGE:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=ALL_SKILLS_FAILED_MESSAGE
        )

    if state.get("error"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error occured due to generate questions"
        )

    question_sets = state.get("question_sets") or []
    if not question_sets:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=ALL_SKILLS_FAILED_MESSAGE
        )
    session_id = None

    if db_user:
        session = Interview_Session(
                user_id = db_user.id,
                resume_id = resume_id,
                mode = "question_bank",
                interview_type = "technical",
                difficulty_level = payload.difficulty_level.value,
                duration_minutes = None,
                status = "completed",
                ended_at = datetime.utcnow()
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        order = 0

        for qs in question_sets:
            for q in qs.get("questions", []):
                order += 1
                db.add(
                    Question(
                        session_id = session.id,
                        skill = qs.get("skill"),
                        question_text = q["question_text"],
                        question_type = "technical",
                        difficulty_level = payload.difficulty_level.value,
                        order_index = str(order)
                    )
                )
        db.commit()

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
    