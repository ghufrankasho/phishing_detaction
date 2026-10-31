from datetime import datetime, time, timedelta
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import Feedback, Scan, User

# Every route in this file is admin-only and lives under /admin
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _domain(kind: str, content: str | None) -> str | None:
    """Host name of a stored URL scan (None for emails and messages)."""
    if kind != "url" or not content:
        return None
    value = content if "://" in content else "http://" + content
    try:
        return urlparse(value).hostname
    except ValueError:
        return None


@router.get("/stats")
def admin_stats(db: Session = Depends(get_db)):
    total_scans = db.query(func.count(Scan.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0

    # Counts per kind (url / email / message) and per verdict
    by_kind = {"url": 0, "email": 0, "message": 0}
    for kind, n in db.query(Scan.kind, func.count(Scan.id)).group_by(Scan.kind):
        by_kind[kind] = n

    by_verdict = {"safe": 0,  "phishing": 0}
    for label, n in db.query(Scan.label, func.count(Scan.id)).group_by(Scan.label):
        if label in by_verdict:
            by_verdict[label] = n

    # Scans per day for the last 7 days (days with no scans count as 0)
    since = datetime.utcnow().date() - timedelta(days=6)
    rows = (
        db.query(func.date(Scan.created_at), func.count(Scan.id))
        .filter(Scan.created_at >= datetime.combine(since, time.min))
        .group_by(func.date(Scan.created_at))
        .all()
    )
    counts = {str(d): n for d, n in rows}
    daily = []
    for i in range(7):
        day = since + timedelta(days=i)
        daily.append(
            {"day": day.strftime("%a"), "date": str(day), "scans": counts.get(str(day), 0)}
        )

    return {
        "total_scans": total_scans,
        "total_users": total_users,
        "threats":  by_verdict["phishing"],
        "by_kind": by_kind,
        "by_verdict": by_verdict,
        "daily": daily,
    }


@router.get("/scans")
def admin_scans(
    kind: str | None = None,
    verdict: str | None = None,
    q: str | None = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    base = db.query(Scan, User).join(User, User.id == Scan.user_id)
    if kind:
        base = base.filter(Scan.kind == kind)
    if q:
        like = f"%{q.strip()}%"
        base = base.filter(
            or_(Scan.content.ilike(like), User.name.ilike(like), User.email.ilike(like))
        )

    # Verdict counts for the cards (they ignore the verdict filter on purpose)
    counts = {"safe": 0, "phishing": 0}
    for label, n in base.with_entities(Scan.label, func.count(Scan.id)).group_by(Scan.label):
        if label in counts:
            counts[label] = n

    query = base.filter(Scan.label == verdict) if verdict else base

    total = query.count()
    rows = (
        query.order_by(Scan.created_at.desc())
        .offset((max(page, 1) - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "counts": counts,
        "items": [
            {
                "id": s.id,
                "user_name": u.name,
                "user_email": u.email,
                "kind": s.kind,
                "domain": _domain(s.kind, s.content),
                "preview": (s.content or "")[:120],
                "score": s.score,      # 0-100
                "label": s.label,
                "created_at": s.created_at,
            }
            for s, u in rows
        ],
    }


@router.get("/scans/{scan_id}")
def admin_scan_detail(scan_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Scan, User)
        .join(User, User.id == Scan.user_id)
        .filter(Scan.id == scan_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found")
    s, u = row
    return {
        "id": s.id,
        "user_id": u.id,
        "user_name": u.name,
        "user_email": u.email,
        "kind": s.kind,
        "domain": _domain(s.kind, s.content),
        "content": s.content,          # full stored text (already masked)
        "score": s.score,              # 0-100
        "label": s.label,
        "created_at": s.created_at,
    }


class ScansDeleteIn(BaseModel):
    ids: list[int]


@router.post("/scans/delete")
def admin_delete_scans(body: ScansDeleteIn, db: Session = Depends(get_db)):
    if not body.ids:
        raise HTTPException(status_code=400, detail="No items selected")

    found = [i for (i,) in db.query(Scan.id).filter(Scan.id.in_(body.ids)).all()]
    if found:
        # Feedback rows point to the scan, so remove them first
        db.query(Feedback).filter(Feedback.scan_id.in_(found)).delete(synchronize_session=False)
        db.query(Scan).filter(Scan.id.in_(found)).delete(synchronize_session=False)
        db.commit()

    return {"deleted": len(found)}