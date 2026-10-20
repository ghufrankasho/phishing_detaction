import re
from datetime import date
from typing import Optional

import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import current_user
from app.models import EmployeeProfile, User

router = APIRouter(tags=["profile"])


# ---------------------------------------------------------------- schemas
class NameUpdate(BaseModel):
    name: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    new_password_confirmation: str


class EmployeeIn(BaseModel):
    department: Optional[str] = None
    position: Optional[str] = None
    employee_number: Optional[str] = None
    hire_date: Optional[date] = None
    phone: Optional[str] = None
    extension: Optional[str] = None
    notes: Optional[str] = None


# ---------------------------------------------------------------- helpers
EMP_FIELDS = ("department", "position", "employee_number", "hire_date", "phone", "extension", "notes")
EMP_NO_RE = re.compile(r"^[A-Za-z0-9\-_/]+$")
PHONE_RE = re.compile(r"^\+?[0-9()\-\s]{5,30}$")


def _public(user: User) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


def _password_ok(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except ValueError:  # e.g. password longer than bcrypt's 72-byte limit
        return False


def _clean(value: Optional[str], max_len: int, label: str) -> Optional[str]:
    """Trim; empty becomes None; too long is rejected."""
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    if len(value) > max_len:
        raise HTTPException(status_code=400, detail=f"{label}: الحد الأقصى {max_len} حرف")
    return value


def _employee_out(row: Optional[EmployeeProfile]) -> dict:
    data = {f: None for f in EMP_FIELDS}
    if row:
        for f in EMP_FIELDS:
            data[f] = getattr(row, f)
        if row.hire_date:
            data["hire_date"] = row.hire_date.isoformat()
    return data


# ---------------------------------------------------------------- account
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


# ---------------------------------------------------------------- employee details
@router.get("/profile/employee")
def get_employee(user: User = Depends(current_user), db: Session = Depends(get_db)):
    row = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user.id).first()
    return _employee_out(row)


@router.put("/profile/employee")
def save_employee(
    data: EmployeeIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    department = _clean(data.department, 100, "القسم")
    position = _clean(data.position, 100, "المنصب")
    employee_number = _clean(data.employee_number, 50, "رقم الموظف")
    phone = _clean(data.phone, 30, "رقم الهاتف")
    extension = _clean(data.extension, 10, "التحويلة")
    notes = _clean(data.notes, 1000, "الملاحظات")

    if employee_number and not EMP_NO_RE.match(employee_number):
        raise HTTPException(status_code=400, detail="رقم الموظف: أحرف إنجليزية وأرقام و - _ / فقط")
    if phone and not PHONE_RE.match(phone):
        raise HTTPException(status_code=400, detail="رقم الهاتف غير صالح")
    if extension and not extension.isdigit():
        raise HTTPException(status_code=400, detail="التحويلة: أرقام فقط")
    if data.hire_date and data.hire_date > date.today():
        raise HTTPException(status_code=400, detail="تاريخ التعيين لا يمكن أن يكون في المستقبل")

    # one row per user: create it the first time, update it afterwards
    row = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user.id).first()
    if not row:
        row = EmployeeProfile(user_id=user.id)
        db.add(row)

    row.department = department
    row.position = position
    row.employee_number = employee_number
    row.hire_date = data.hire_date
    row.phone = phone
    row.extension = extension
    row.notes = notes

    db.commit()
    db.refresh(row)
    return _employee_out(row)