from app.database import Base, SessionLocal, engine
from app.models import Permission

PERMISSION_NAMES = (
    "manage_emails",
    "manage_messages",
    "manage_domains",
)


def seed_permissions() -> None:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        for name in PERMISSION_NAMES:
            exists = db.query(Permission).filter_by(name=name).first()
            if not exists:
                db.add(Permission(name=name))

        db.commit()


if __name__ == "__main__":
    seed_permissions()