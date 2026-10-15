import datetime

from pydantic import BaseModel, ConfigDict, Field
from typing import Literal

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    role: Literal["user", "admin"] | None = None