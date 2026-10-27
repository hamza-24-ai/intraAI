from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.user import CreateUser,LoginUser,CreateToken
from app.cores.supabase_client import supabase
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.cores.database import get_db
from app.models.users import User
from pydantic import BaseModel, EmailStr

FRONTEND_URL =  "http://localhost:3000"



router = APIRouter(prefix="/auth", tags=["Auth"])


# writing routers to crearte SignUp

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(data : CreateUser, db : Session = Depends(get_db)):
    try:
        response = supabase.auth.sign_up({
            "email" : data.email,
            "password" : data.password,
            "options" : {
                "data" : {
                    "name" : data.name
                },
                "email_redirect_to": f"{FRONTEND_URL}/verify",
            }
        }) 

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


    if response.user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sign Up Failed Please Try again"
        )

    try:
        db.add(
            User(
                supabase_user_id = response.user.id,
                name = data.name,
                email = data.email
            )
        )
        db.commit()
        db.refresh(User)
    except IntegrityError:
        db.rollback()

    return {
        "message" : "SignUp Successfully Please check your email to verify your account",
        "user_id" : response.user.id,
        "email" : response.user.email 
    }



# generating Login Auth Router

@router.post("/login")
def signin(data : LoginUser):

    try:
        response = supabase.auth.sign_in_with_password({
                "email" : data.email,
                "password" : data.password
                })

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Credential or email is not verified"
        )

    if response.session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login Failed Please try again"
        )

    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "token_type": "bearer",
        "user_id": response.user.id,
        "email": response.user.email,
    }


    # Resend Verification 
class ResendRequest(BaseModel):
    email: EmailStr


@router.post("/resend-verification")
def resend_verification(payload: ResendRequest):
    try:
        supabase.auth.resend({
            "type": "signup",
            "email": payload.email,
            "options": {"email_redirect_to": f"{FRONTEND_URL}/verify"},
        })
    except Exception as e:
        text = str(e).lower()
        if "rate" in text or "seconds" in text or "too many" in text:
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Please wait a minute before requesting another email.")
        # any other error: stay silent so this endpoint can't reveal which emails are registered
    return {"message": "If this email is registered and not yet verified, a new link has been sent."}