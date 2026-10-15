from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import DomainList
from app.schemas.domain_list import DomainListIn, DomainListOut
from app.utils import parse_list_params, set_content_range

router = APIRouter(tags=["admin: domain lists"], dependencies=[Depends(require_admin)])

SORTABLE = {"id", "domain", "list_type", "created_at"}


def get_or_404(db: Session, item_id: int) -> DomainList:
    item = db.get(DomainList, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Domain not found")
    return item


def ensure_unique(db: Session, domain: str, exclude_id: int | None = None):
    q = db.query(DomainList).filter(DomainList.domain == domain)
    if exclude_id:
        q = q.filter(DomainList.id != exclude_id)
    if q.first():
        raise HTTPException(status_code=400, detail="This domain is already in a list")


@router.get("/domain_lists", response_model=list[DomainListOut])
def list_domains(
    response: Response,
    range: str = "[0,24]",
    sort: str = '["id","ASC"]',
    filter: str = "{}",
    db: Session = Depends(get_db),
):
    start, end, field, order, f = parse_list_params(range, sort, filter)

    query = db.query(DomainList)
    if f.get("list_type"):
        query = query.filter(DomainList.list_type == f["list_type"])
    if f.get("q"):
        query = query.filter(DomainList.domain.ilike(f"%{f['q']}%"))

    total = query.count()
    col = getattr(DomainList, field) if field in SORTABLE else DomainList.id
    query = query.order_by(col.desc() if order == "DESC" else col.asc())
    rows = query.offset(start).limit(end - start + 1).all()

    set_content_range(response, "domain_lists", start, len(rows), total)
    return rows


@router.get("/domain_lists/{item_id}", response_model=DomainListOut)
def get_domain(item_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, item_id)


@router.post("/domain_lists", response_model=DomainListOut, status_code=201)
def create_domain(body: DomainListIn, db: Session = Depends(get_db)):
    ensure_unique(db, body.domain)
    item = DomainList(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/domain_lists/{item_id}", response_model=DomainListOut)
def update_domain(item_id: int, body: DomainListIn, db: Session = Depends(get_db)):
    item = get_or_404(db, item_id)
    ensure_unique(db, body.domain, exclude_id=item_id)
    for key, value in body.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/domain_lists/{item_id}", response_model=DomainListOut)
def delete_domain(item_id: int, db: Session = Depends(get_db)):
    item = get_or_404(db, item_id)
    deleted = DomainListOut.model_validate(item)
    db.delete(item)
    db.commit()
    return deleted