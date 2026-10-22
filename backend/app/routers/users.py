import json

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import Permission, User
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(tags=["admin: users"], dependencies=[Depends(require_admin)])

 
SORTABLE = {"id", "name", "email", "role", "created_at"}

@router.get("/users", response_model=list[UserOut])
def list_users(
    response: Response,
    range: str = "[0,24]",
    sort: str = '["id","ASC"]',
    filter: str = "{}",
    db: Session = Depends(get_db),
):
    start, end = json.loads(range)
    sort_field, sort_order = json.loads(sort)
    f = json.loads(filter)

    query = db.query(User)
    if f.get("role"):
        query = query.filter(User.role == f["role"])
    if f.get("q"):
        like = f"%{f['q']}%"
        query = query.filter(or_(User.name.ilike(like), User.email.ilike(like)))

    total = query.count()

    col = getattr(User, sort_field) if sort_field in SORTABLE else User.id
    query = query.order_by(col.desc() if sort_order == "DESC" else col.asc())

    rows = query.offset(start).limit(end - start + 1).all()
    response.headers["Content-Range"] = f"users {start}-{start + len(rows) - 1}/{total}"
    return rows


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/users/{user_id}", response_model=UserOut)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You can't delete your own account")

    deleted = UserOut.model_validate(user)   # copy the data before the row is gone
    db.delete(user)
    db.commit()
    return deleted

@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id and body.role == "user":
        raise HTTPException(status_code=400, detail="You can't remove your own admin role")

    updates = body.model_dump(exclude_unset=True)
    if "permissions" in updates:
        permission_names = updates.pop("permissions")
        if permission_names is None:
            permission_names = []
        permissions = (
            db.query(Permission)
            .filter(Permission.name.in_(permission_names))
            .all()
            if permission_names
            else []
        )
        if len(permissions) != len(permission_names):
            raise HTTPException(
                status_code=503,
                detail="Permission records are not initialized; run the permission seed script",
            )
        user.permissions = permissions

    for key, value in updates.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user
