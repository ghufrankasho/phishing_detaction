from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import current_user
from app.models import User
from app.schemas.auth import LoginIn, RegisterIn
from app.schemas.user import UserOut
from app.security import create_token, hash_password, verify_password

router = APIRouter(tags=["auth"])


@router.post("/register", status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if data.password != data.password_confirmation:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(name=data.name, email=data.email, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_token(user.email), "user": UserOut.model_validate(user)}


@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": create_token(user.email), "user": UserOut.model_validate(user)}


@router.get("/user", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user