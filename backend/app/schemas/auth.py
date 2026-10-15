from pydantic import BaseModel, EmailStr


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    role: bool    # admin or employee
    password: str
    password_confirmation: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str