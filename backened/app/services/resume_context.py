from fastapi import HTTPException, status
from app.models.resumes import Resume



def resolve_resume(db, db_user, skills, target_role, resume_id):

    if resume_id is not None:
        if db_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User Must login to save resume"
            )

        resume = (
            db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == db_user.id).first()
        )

        if resume.id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume Not found"
            )

        parse = resume.parsed_skills or {}

        return parse.get("skills", []), target_role or parse.get("target_role"), resume.id

    if not skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide Either Resume id or skills"
        )

    return skills, target_role, None
