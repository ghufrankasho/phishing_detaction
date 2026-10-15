from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import ThreatPattern
from app.schemas.threat_pattern import ThreatPatternIn, ThreatPatternOut
from app.utils import parse_list_params, set_content_range

router = APIRouter(tags=["admin: threat patterns"], dependencies=[Depends(require_admin)])

SORTABLE = {"id", "pattern", "pattern_type", "category", "is_active", "created_at"}


def get_or_404(db: Session, item_id: int) -> ThreatPattern:
    item = db.get(ThreatPattern, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Pattern not found")
    return item


@router.get("/threat_patterns", response_model=list[ThreatPatternOut])
def list_patterns(
    response: Response,
    range: str = "[0,24]",
    sort: str = '["id","ASC"]',
    filter: str = "{}",
    db: Session = Depends(get_db),
):
    start, end, field, order, f = parse_list_params(range, sort, filter)

    query = db.query(ThreatPattern)
    if f.get("category"):
        query = query.filter(ThreatPattern.category == f["category"])
    if f.get("pattern_type"):
        query = query.filter(ThreatPattern.pattern_type == f["pattern_type"])
    if f.get("is_active") is not None:
        query = query.filter(ThreatPattern.is_active == bool(f["is_active"]))
    if f.get("q"):
        query = query.filter(ThreatPattern.pattern.ilike(f"%{f['q']}%"))

    total = query.count()
    col = getattr(ThreatPattern, field) if field in SORTABLE else ThreatPattern.id
    query = query.order_by(col.desc() if order == "DESC" else col.asc())
    rows = query.offset(start).limit(end - start + 1).all()

    set_content_range(response, "threat_patterns", start, len(rows), total)
    return rows


@router.get("/threat_patterns/{item_id}", response_model=ThreatPatternOut)
def get_pattern(item_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, item_id)


@router.post("/threat_patterns", response_model=ThreatPatternOut, status_code=201)
def create_pattern(body: ThreatPatternIn, db: Session = Depends(get_db)):
    item = ThreatPattern(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/threat_patterns/{item_id}", response_model=ThreatPatternOut)
def update_pattern(item_id: int, body: ThreatPatternIn, db: Session = Depends(get_db)):
    item = get_or_404(db, item_id)
    for key, value in body.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/threat_patterns/{item_id}", response_model=ThreatPatternOut)
def delete_pattern(item_id: int, db: Session = Depends(get_db)):
    item = get_or_404(db, item_id)
    deleted = ThreatPatternOut.model_validate(item)
    db.delete(item)
    db.commit()
    return deleted