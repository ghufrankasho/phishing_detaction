from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import current_user
from app.dependencies import require_admin
from app.models import User
from app.scanner import analyze
from app.schemas.scan import ScanIn
from app.database import get_db
from app.models import Feedback, Scan
from app.schemas.feedback import FeedbackCreate
from app.utils import mask_sensitive

router = APIRouter(tags=["admin: scan"], dependencies=[Depends(require_admin)])


@router.post("/scan")
def scan(data: ScanIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    content = data.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="المحتوى فارغ")
    if len(content) > 5000:
        raise HTTPException(status_code=400, detail="المحتوى طويل جداً (الحد الأقصى 5000 حرف)")

    result = analyze(data.kind, content)

    record = Scan(
        user_id=user.id,
        kind=data.kind,
        content=mask_sensitive(content),
        score=result.get("score"),
        label=result.get("label"),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {**result, "scan_id": record.id}


@router.post("/scans/{scan_id}/feedback", status_code=201)
def report_result(
    scan_id: int,
    body: FeedbackCreate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    scan_row = db.get(Scan, scan_id)
    if not scan_row or scan_row.user_id != user.id:
        raise HTTPException(status_code=404, detail="Scan not found")
    if db.query(Feedback).filter_by(scan_id=scan_id, user_id=user.id).first():
        raise HTTPException(status_code=400, detail="You already reported this result")

    item = Feedback(scan_id=scan_id, user_id=user.id, **body.model_dump())
    db.add(item)
    db.commit()
    return {"id": item.id, "status": item.status}