import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


def normalize_domain(value: str) -> str:
    v = value.strip().lower()
    v = re.sub(r"^[a-z][a-z0-9+.-]*://", "", v)      # remove http://
    v = v.split("/")[0].split("?")[0].split(":")[0]   # remove path, query, port
    if v.startswith("www."):
        v = v[4:]
    if not re.fullmatch(r"([a-z0-9-]+\.)+[a-z0-9-]{2,}", v):
        raise ValueError("Invalid domain")
    return v


class DomainListIn(BaseModel):
    domain: str
    list_type: Literal["whitelist", "blacklist", "official"]
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("domain")
    @classmethod
    def clean_domain(cls, v: str) -> str:
        return normalize_domain(v)


class DomainListOut(BaseModel):
    id: int
    domain: str
    list_type: str
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)