from fastapi import Depends, HTTPException, UploadFile, File, status, APIRouter
from sqlalchemy.orm import Session
from app.cores.cloudinary import delete_transcript, upload_transcript
from app.models.resumes import Resume
from app.schemas.resume import ResumeResponse
from app.cores.database import get_db
from app.cores.auth_dependancy import get_current_user_optional, get_current_user, get_optional_db_user, get_db_user
import os
from app.agent.file_info import extracter_file_data
# from app.agent.state import Agent_Pipeline
import uuid
from app.agent.resume_parser_agent import resume_parser_agent
from typing import List


router = APIRouter(prefix="/resume", tags=["Resume"])

MAX_File = 5*1024*1024

@router.post("/upload")
def resume_upload(
    file : UploadFile = File(...),
    db : Session = Depends(get_db),
    current_user = Depends(get_current_user_optional),
    db_user = Depends(get_optional_db_user)
):

    content = file.file.read()

    if len(content) > MAX_File:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="5MB file is required "
        )

    file_url,_ = upload_transcript(content,file.filename)

    user_id = int(db_user.id) if current_user else ""

    state1 = {
        "user_id" : user_id,
        "file_path" : file_url,
        "needs_manual_role_input" : False
    }

    state = extracter_file_data(state1)

    ext = os.path.splitext(file.filename,"")[1].lower()
    public_id = f"intraAI{uuid.uuid4().hex}{ext}"
    if not state["is_valid_file"]:
        delete_transcript(public_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only Docx and PDF are accepted"
        )

    state = resume_parser_agent(state)

    if state.get("error"):
        delete_transcript(public_id)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Data is unprocessable"
        )

    parsed = {
        "skills" : state["skills"],
        "target_role" : state["target_role"],
        "role_source" : state["role_source"],
        "experience_level" : state["experience_level"],
        "projects" : state["projects"]
    }

    # add in db only if user has login

    resume = None
    if current_user:
        resume = Resume(
            user_id = user_id,
            file_url = file_url,
            parsed_skills = parsed

        )

        db.add(resume)
        db.commit()
        db.refresh(resume)

    else:
        delete_transcript(public_id)

    return {
        "saved": resume is not None,
        "resume_id": str(resume.id) if resume else None,
        "parsed": parsed,
        "needs_manual_role_input": state["needs_manual_role_input"],
    }


# Get data only if user login here 

@router.get("/", List[ResumeResponse])
def list_resumes(
    db : Session = Depends(get_db),
    current_user = Depends(get_db_user) 
):

    return (
        db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).all()
    )



# Get Resume detail by ID 

@router.get("/{resume_id}", response_model=ResumeResponse)
def resume_by_id(
    resume_id = uuid.UUID,
    db : Session = Depends(get_db),
    current_user = Depends(get_db_user)
):

    resume = (
        db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    )

    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid Resume not Found"
        )
    return resume






