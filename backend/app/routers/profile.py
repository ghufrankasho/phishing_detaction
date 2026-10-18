import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import current_user
from app.models import User

router = APIRouter(tags=["profile"])


class NameUpdate(BaseModel):
    name: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    new_password_confirmation: str


def _public(user: User) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


def _password_ok(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except ValueError:  # e.g. password longer than bcrypt's 72-byte limit
        return False


@router.patch("/profile")
def update_profile(
    data: NameUpdate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    name = " ".join(data.name.split())  # trims and collapses repeated spaces
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="الاسم قصير جداً")
    if len(name) > 100:
        raise HTTPException(status_code=400, detail="الاسم طويل جداً (الحد الأقصى 100 حرف)")

    row = db.get(User, user.id)
    row.name = name
    db.commit()
    db.refresh(row)
    return _public(row)


@router.post("/profile/password")
def change_password(
    data: PasswordChange,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    row = db.get(User, user.id)

    # 400 (not 401) so a wrong current password doesn't look like an expired login
    if not _password_ok(data.current_password, row.password_hash):
        raise HTTPException(status_code=400, detail="كلمة المرور الحالية غير صحيحة")
    if data.new_password != data.new_password_confirmation:
        raise HTTPException(status_code=400, detail="كلمتا المرور الجديدتان غير متطابقتين")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف")
    if len(data.new_password.encode()) > 72:
        raise HTTPException(status_code=400, detail="كلمة المرور الجديدة طويلة جداً")
    if data.new_password == data.current_password:
        raise HTTPException(status_code=400, detail="كلمة المرور الجديدة يجب أن تختلف عن الحالية")

    row.password_hash = bcrypt.hashpw(data.new_password.encode(), bcrypt.gensalt()).decode()
    db.commit()
    return {"message": "تم تغيير كلمة المرور"}