from fastapi import status,HTTPException,Depends
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.cores.database import get_db
from app.models.users import User
from jose import JWTError,jwt
from dotenv import load_dotenv
from datetime import datetime,timedelta
import os 

load_dotenv()

# Extracting env Variables 

ALGORITHM = os.getenv("ALGORITHM")
SECRET_KEY = os.getenv("SECRET_KEY")
EXCESS_TOKEN_EXPIRE = int(os.getenv("EXCESS_TOKEN_EXPIRE"))

# Password hashing & verification logic

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth_schema = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hashed_password(password : str):
    return pwd_context.hash(password)

def verify_password(plain,hashed):
    return pwd_context.verify(plain,hashed)

# Token Created logic

def create_token(data : dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=EXCESS_TOKEN_EXPIRE)
    to_encode.update({
        "exp" : expire
    })

    return jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)

# Get Current User information

def get_current_user(
        token : str = Depends(oauth_schema),
        db : Session = Depends(get_db)
):
    exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid Token Identified",
        headers={"WWW-Authenticate":"Bearer"}
    )

    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        
        user_id : int = payload.get("sub")
        if user_id is None:
            raise exception
    except JWTError:
        raise exception

    user = db.query(User).filter(User.id ==  int(user_id)).first()
    if user is None:
        raise exception

    return user


# Email Verification 
def create_verification_token(user_id: int):
    expire = datetime.utcnow() + timedelta(minutes=30)  # verification link 30 min valid
    to_encode = {"sub": str(user_id), "exp": expire, "purpose": "email_verification"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_verification_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") != "email_verification":
            return None
        return payload.get("sub")
    except JWTError:
        return None
