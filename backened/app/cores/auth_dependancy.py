from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional

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