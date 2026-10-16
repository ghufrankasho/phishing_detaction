"""
Read-only dashboard endpoints (stats, lists, details) built on the Scan model.
Put this file next to your scan router and include it in main.py:

    from app.routers import dashboard
    app.include_router(dashboard.router)
"""
from datetime import datetime, timezone
from typing import Literal, Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import current_user
from app.models import Scan, User

# ---------------------------------------------------------------------------
# ADJUST THESE TWO to match how your scan route stores its results
# ---------------------------------------------------------------------------
SCORE_MAX = 100  # Scan.score is an int from 0 to SCORE_MAX (higher = riskier)
LABEL_MAP = {    # stored Scan.label (lowercase) -> safe | suspicious | phishing
    "safe": "safe", "legitimate": "safe", "legit": "safe", "benign": "safe", "ham": "safe",
    "suspicious": "suspicious", "warning": "suspicious",
    "phishing": "phishing", "malicious": "phishing", "fraud": "phishing",
    "scam": "phishing", "spam": "phishing",
}
# ---------------------------------------------------------------------------

KINDS = ("email", "message", "url")
VERDICTS = ("safe", "suspicious", "phishing")

SUMMARY = {
    "safe": "لم نجد مؤشرات واضحة على الاحتيال. ومع ذلك، تحقق دائماً من المصدر.",
    "suspicious": "هناك مؤشرات مريبة. لا تُدخل بياناتك قبل التأكد من المصدر.",
    "phishing": "مؤشرات قوية على الاحتيال. لا تفتح الرابط ولا تشارك أي معلومات.",
}


def verdict_of(scan_label: Optional[str]) -> str:
    # Anything unrecognised (or missing) shows as "suspicious" rather than
    # being silently counted as safe.
    return LABEL_MAP.get((scan_label or "").strip().lower(), "suspicious")


def verdict_clause(verdict: str):
    label = func.lower(func.coalesce(Scan.label, ""))
    in_verdict = label.in_([k for k, v in LABEL_MAP.items() if v == verdict])
    if verdict == "suspicious":
        return or_(in_verdict, ~label.in_(list(LABEL_MAP)))
    return in_verdict


def domain_of(content: str) -> Optional[str]:
    value = (content or "").strip()
    if not value:
        return None
    try:
        parsed = urlparse(value if "://" in value else "http://" + value)
        host = parsed.hostname
    except ValueError:  # e.g. an unmatched "[" makes urlparse raise "Invalid IPv6 URL"
        return None
    return host[:255] if host else None


def iso(dt: datetime) -> str:
    # SQLite returns naive datetimes; they were stored as UTC
    return (dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)).isoformat()


def risk(score: Optional[int]) -> float:
    if score is None or SCORE_MAX <= 0:
        return 0.0
    return round(min(max(score / SCORE_MAX, 0.0), 1.0), 2)


def scan_summary(s: Scan) -> dict:
    return {
        "id": s.id,
        "kind": s.kind,
        "domain": domain_of(s.content) if s.kind == "url" else None,
        "verdict": verdict_of(s.label),
        "score": risk(s.score),
        "preview": s.content[:120],
        "created_at": iso(s.created_at),
    }

router = APIRouter(tags=["dashboard"])



@router.get("/stats")
def stats(db: Session = Depends(get_db), user: User = Depends(current_user)):
    rows = (
        db.query(Scan.kind, Scan.label, func.count(Scan.id))
        .filter(Scan.user_id == user.id)
        .group_by(Scan.kind, Scan.label)
        .all()
    )
    by_kind = {k: {"total": 0, **{v: 0 for v in VERDICTS}} for k in KINDS}
    for kind, label, count in rows:
        if kind not in by_kind:
            continue
        by_kind[kind]["total"] += count
        by_kind[kind][verdict_of(label)] += count

    url_contents = (
        db.query(Scan.content)
        .filter(Scan.user_id == user.id, Scan.kind == "url")
        .all()
    )
    unique_domains = {d for (c,) in url_contents if (d := domain_of(c))}

    recent = (
        db.query(Scan)
        .filter(Scan.user_id == user.id)
        .order_by(Scan.created_at.desc(), Scan.id.desc())
        .limit(5)
        .all()
    )
    return {
        "total": sum(v["total"] for v in by_kind.values()),
        "by_kind": by_kind,
        "unique_domains": len(unique_domains),
        "recent": [scan_summary(s) for s in recent],
    }

@router.get("/scans")
def list_scans(
    kind: Optional[Literal["email", "message", "url"]] = None,
    verdict: Optional[Literal["safe", "suspicious", "phishing"]] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    page = max(page, 1)
    limit = min(max(limit, 1), 50)

    query = db.query(Scan).filter(Scan.user_id == user.id)
    if kind:
        query = query.filter(Scan.kind == kind)
    if verdict:
        query = query.filter(verdict_clause(verdict))

    total = query.count()
    items = (
        query.order_by(Scan.created_at.desc(), Scan.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "items": [scan_summary(s) for s in items],
        "total": total,
        "page": page,
        "limit": limit,
    }

@router.get("/scans/{scan_id}")
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    # Filtering by user_id means nobody can read another user's scan by guessing ids
    row = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="الفحص غير موجود")
    data = scan_summary(row)
    return {
        **data,
        "content": row.content,  # already masked when your scan route saved it
        "summary": SUMMARY[data["verdict"]],
        "indicators": [],
    }