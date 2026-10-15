from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import Feedback
from app.schemas.feedback import FeedbackOut, FeedbackReview
from app.utils import parse_list_params, set_content_range

router = APIRouter(tags=["admin: feedback"], dependencies=[Depends(require_admin)])

SORTABLE = {"id", "report_type", "status", "created_at"}


def to_out(fb: Feedback) -> FeedbackOut:
    return FeedbackOut(
        id=fb.id,
        scan_id=fb.scan_id,
        user_email=fb.user.email,
        report_type=fb.report_type,
        comment=fb.comment,
        status=fb.status,
        correct_label=fb.correct_label,
        created_at=fb.created_at,
        reviewed_at=fb.reviewed_at,
        scan_content=fb.scan.content,
        scan_score=fb.scan.score,
        scan_label=fb.scan.label,
    )


def get_or_404(db: Session, item_id: int) -> Feedback:
    fb = db.get(Feedback, item_id)
    if not fb:
        raise HTTPException(status_code=404, detail="Report not found")
    return fb


@router.get("/feedback", response_model=list[FeedbackOut])
def list_feedback(
    response: Response,
    range: str = "[0,24]",
    sort: str = '["id","DESC"]',
    filter: str = "{}",
    db: Session = Depends(get_db),
):
    start, end, field, order, f = parse_list_params(range, sort, filter)

    query = db.query(Feedback)
    if f.get("status"):
        query = query.filter(Feedback.status == f["status"])
    if f.get("report_type"):
        query = query.filter(Feedback.report_type == f["report_type"])

    total = query.count()
    col = getattr(Feedback, field) if field in SORTABLE else Feedback.id
    query = query.order_by(col.desc() if order == "DESC" else col.asc())
    rows = query.offset(start).limit(end - start + 1).all()

    set_content_range(response, "feedback", start, len(rows), total)
    return [to_out(r) for r in rows]


@router.get("/feedback/{item_id}", response_model=FeedbackOut)
def get_feedback(item_id: int, db: Session = Depends(get_db)):
    return to_out(get_or_404(db, item_id))


@router.put("/feedback/{item_id}", response_model=FeedbackOut)
def review_feedback(item_id: int, body: FeedbackReview, db: Session = Depends(get_db)):
    fb = get_or_404(db, item_id)
    fb.status = body.status
    fb.correct_label = body.correct_label if body.status == "accepted" else None
    fb.reviewed_at = datetime.now(timezone.utc) if body.status != "pending" else None
    db.commit()
    db.refresh(fb)
    return to_out(fb)