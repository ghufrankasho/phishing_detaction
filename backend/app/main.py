from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, scan, users, domain_lists, threat_patterns
 
from app.routers import dashboard
 
from app.config import settings
from app.database import Base, engine
from app.routers import auth, scan, users
from app.routers import profile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range"],
)

Base.metadata.create_all(bind=engine)

app.include_router(domain_lists.router)
app.include_router(threat_patterns.router)
app.include_router(auth.router)
app.include_router(scan.router)
app.include_router(users.router)
app.include_router(dashboard.router)

app.include_router(profile.router)