import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Category = Literal["urgency", "credentials", "banking", "prize", "impersonation"]


class ThreatPatternIn(BaseModel):
    pattern: str = Field(max_length=500)
    pattern_type: Literal["keyword", "regex"]
    category: Category
    is_active: bool = True

    @field_validator("pattern")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Pattern can't be empty")
        return v

    @model_validator(mode="after")
    def check_regex(self):
        if self.pattern_type == "regex":
            try:
                re.compile(self.pattern)
            except re.error as e:
                raise ValueError(f"Invalid regular expression: {e}")
        return self


class ThreatPatternOut(BaseModel):
    id: int
    pattern: str
    pattern_type: str
    category: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)