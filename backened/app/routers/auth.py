from fastapi import APIRouter, HTTPException, status
from app.schemas.user import CreateUser,LoginUser,CreateToken
from app.cores.supabase_client import supabase



router = APIRouter(prefix="/auth", tags=["Auth"])


# writing routers to crearte SignUp

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(data : CreateUser):
    try:
        response = supabase.auth.sign_up({
            "email" : data.email,
            "password" : data.password,
            "options" : {
                "data" : {
                    "name" : data.name
                }
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