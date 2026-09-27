from pydantic import BaseModel, EmailStr
from datetime import datetime


class CreateUser(BaseModel):
    name : str
    email : EmailStr
    password : str

class LoginUser(BaseModel):
    email : EmailStr
    password : str


class ResponseUser(BaseModel):
    id : int
    name : str
    email : EmailStr
    is_verified : bool
    created_at : datetime

    class Config:
        from_attributes : True

class CreateToken(BaseModel):
    access_token : str
    token_type : str
    user : ResponseUser
