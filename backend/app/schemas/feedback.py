from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class FeedbackCreate(BaseModel):
    report_type: Literal["false_positive", "false_negative"]
    comment: str | None = Field(default=None, max_length=1000)


class FeedbackReview(BaseModel):
    status: Literal["pending", "accepted", "rejected"]
    correct_label: Literal["safe", "phishing"] | None = None

    @model_validator(mode="after")
    def label_needed_when_accepting(self):
        if self.status == "accepted" and not self.correct_label:
            raise ValueError("Choose the correct label when accepting a report")
        return self


class FeedbackOut(BaseModel):
    id: int
    scan_id: int
    user_email: str
    report_type: str
    comment: str | None
    status: str
    correct_label: str | None
    created_at: datetime
    reviewed_at: datetime | None
    scan_content: str
    scan_score: int | None
    scan_label: str | None