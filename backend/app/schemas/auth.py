from datetime import datetime

from pydantic import BaseModel, EmailStr


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    role: str    # admin or employee
    password: str
    password_confirmation: str
    create_at:datetime | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str