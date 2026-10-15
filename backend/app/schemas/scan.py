from typing import Literal

from pydantic import BaseModel


class ScanIn(BaseModel):
    kind: Literal["url", "message"]
    content: str