import json

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import Permission, User
from app.schemas.user import UserOut, UserUpdate
from app.models import EmployeeProfile, Permission, User  # Ensure EmployeeProfile is imported
from app.models import DomainList, Scan # Ensure models are imported

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

    # Exclude all users with the admin role
    query = db.query(User).filter(User.role != "admin")
    
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


@router.get("/users/{user_id}/work-items")
def get_user_work_items(
    user_id: int,
    item_type: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Clean up trailing query params if any
    if "?" in item_type:
        item_type = item_type.split("?")[0]

    normalized = item_type.lower().strip()
    if not normalized.endswith("s"):
        normalized += "s"  # e.g., "domain" -> "domains"

    # Map the requested type to the corresponding Scan kind or table
    if normalized in ("messages", "emails", "domains"):
        # Map "domains" to scan kind "url" (or adjust if your app uses "domain" as the kind)
        kind_map = {
            "messages": "message",
            "emails": "email",
            "domains": "url"  # Since domains/URLs tested are saved in the scans table
        }
        kind_val = kind_map[normalized]
        
        items = db.query(Scan).filter(Scan.user_id == user_id, Scan.kind == kind_val).all()
        return [
            {
                "id": s.id, 
                "content": s.content, 
                "score": s.score, 
                "label": s.label, 
                "created_at": s.created_at
            } 
            for s in items
        ]
    else:
        raise HTTPException(status_code=400, detail=f"Invalid item type: {normalized}")
 
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

    # Handle department and position updates via EmployeeProfile
    department = updates.pop("department", None)
    position = updates.pop("position", None)

    if department is not None or position is not None:
        profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user.id).first()
        if not profile:
            profile = EmployeeProfile(user_id=user.id)
            db.add(profile)
        if department is not None:
            profile.department = department
        if position is not None:
            profile.position = position

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