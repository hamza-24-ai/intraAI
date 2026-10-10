from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from app.models.users import User
from sqlalchemy.orm import Session
from app.cores.database import get_db

from app.cores.supabase_client import supabase


oauth_schema = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token : str = Depends(oauth_schema)):

    try:
        user_response = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or Expired Token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if user_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inavlid or expired token"
        )

    return user_response.user



#  user can get the full access except than history 

oauth_schema_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user_optional(token : Optional[str] = Depends(oauth_schema_optional)):

    if token is None:
        return None

    try:
        user_response_optional = supabase.auth.get_user(token)
        return user_response_optional.user
    except Exception:
        return None


# well I create a row of user data in table for other routers because maina pehla khud Authnrtication ka soacha tha lakin 
#  supabase ki authentication ka pata laga tu uski use krlii ab hr table ma changes honi thi jo muhkil tha tu ma uka lya aledha sa 
# get current user and optional user ban raha huu jo baki use kare gaa 

def get_or_create_user(supabase_user, db : Session ) -> User:
    user = db.query(User).filter(User.supabase_user_id == supabase_user.id).first()

    if user is None:
        meta = supabase_user.user_metadata or {}

        user = User(
            supabase_user_id=supabase_user.id,
            name=meta.get("name", ""),
            email=supabase_user.email,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    return user

def get_db_user(supabase_user = Depends(get_current_user), db : Session = Depends(get_db)) -> User :
    return get_or_create_user(supabase_user, db)


def get_optional_db_user(supabase_user = Depends(get_current_user_optional), db : Session = Depends(get_db)) -> Optional[User]:

    if supabase_user is None:
        return None

    return get_or_create_user(supabase_user, db)