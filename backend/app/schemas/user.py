import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PermissionName = Literal["manage_emails", "manage_messages", "manage_domains"]

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    permissions: list[str] = Field(default_factory=list)
    department: str | None = None
    position: str | None = None
    created_at: datetime.datetime | None = Field(default=None, alias="created_at")  
    model_config = ConfigDict(from_attributes=True)

    @field_validator("permissions", mode="before")
    @classmethod
    def permission_names(cls, value):
        return [permission.name for permission in value]

class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    role: str | None = None
    permissions: list[PermissionName] | None = None
    department: str | None = Field(default=None, max_length=100)
    position: str | None = Field(default=None, max_length=100)