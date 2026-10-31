from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.dependencies import current_user
from app.models import Feedback, Scan, User
from app.scanner import analyze
from app.schemas.feedback import FeedbackCreate
from app.schemas.scan import ScanIn
from app.utils import mask_sensitive

# No require_admin here: scanning and reporting are for every logged-in user.
router = APIRouter(tags=["scan"])

class ScanDeleteIn(BaseModel):
    ids: list[int]


@router.post("/scans/delete")
def delete_scans(
    body: ScanDeleteIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if not body.ids:
        raise HTTPException(status_code=400, detail="لم يتم اختيار أي عنصر")

    # Only the user's own scans can be deleted
    scans = (
        db.query(Scan)
        .filter(Scan.id.in_(body.ids), Scan.user_id == user.id)
        .all()
    )
    found_ids = [s.id for s in scans]

    if found_ids:
        # Feedback rows point to the scan, so remove them first
        db.query(Feedback).filter(Feedback.scan_id.in_(found_ids)).delete(
            synchronize_session=False
        )
        for s in scans:
            db.delete(s)
        db.commit()

    return {"deleted": len(found_ids)}
@router.post("/scan")
def scan(data: ScanIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    content = data.content.strip()
    
    # تنظيف الرابط إذا تم إرساله بصيغة ماركداون تالفة
    if data.kind == "url" and "]" in content and "(" in content:
        content = content.split("]")[0].split("(")[-1].strip()

    if not content:
        raise HTTPException(status_code=400, detail="المحتوى فارغ")
    
    result = analyze(data.kind, content)  # analyze the real text...

    raw_score = result.get("score")  # analyzer gives 0-1; the column is an int 0-100
    record = Scan(
        user_id=user.id,
        kind=data.kind,
        content=mask_sensitive(content),  # ...but only store the masked text
        score=None if raw_score is None else round(raw_score * 100),
        label=result.get("verdict"),      # safe  | phishing
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

@router.get("/scans/{scan_id}")
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    owner = db.get(User, scan.user_id)
    return {
        "id": scan.id,
        "user_id": scan.user_id,
        "user_name": owner.name if owner else None,
        "user_email": owner.email if owner else None,
        "kind": scan.kind,
        "content": scan.content,
        "score": scan.score,      # already 0-100 in the database
        "label": scan.label,
        "created_at": scan.created_at,
    }