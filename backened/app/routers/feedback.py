# app/routers/feedback.py
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.cores.auth_dependancy import get_db_user
from app.cores.database import get_db
from app.models.feedback_reports import FeedBack_Report
from app.models.interview_sessions import Interview_Session
from app.schemas.feedback_reports import FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.get("", response_model=List[FeedbackResponse])
def list_my_reports(db: Session = Depends(get_db), db_user=Depends(get_db_user)):
    return (
        db.query(FeedBack_Report)
        .join(Interview_Session, FeedBack_Report.session_id == Interview_Session.id)
        .filter(Interview_Session.user_id == db_user.id)
        .order_by(FeedBack_Report.generated_at.desc())
        .all()
    )


@router.get("/{session_id}", response_model=FeedbackResponse)
def get_report(session_id: int, db: Session = Depends(get_db), db_user=Depends(get_db_user)):
    session = (
        db.query(Interview_Session)
        .filter(Interview_Session.id == session_id, Interview_Session.user_id == db_user.id)
        .first()
    )
    if session is None:
        raise HTTPException(404, "Session not found.")

    report = db.query(FeedBack_Report).filter(FeedBack_Report.session_id == session.id).first()
    if report is None:
        raise HTTPException(404, "No feedback report for this session.")
    return report