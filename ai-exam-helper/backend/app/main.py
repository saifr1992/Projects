import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.user import User
from app.routers import admin as admin_router
from app.routers import auth as auth_router
from app.routers import chat as chat_router
from app.routers import papers as papers_router
from app.routers import quiz as quiz_router

app = FastAPI(
    title="AI Exam Helper API",
    description="Backend for the AI-powered exam preparation assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def seed_admin(db: Session) -> None:
    existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL.lower()).first()
    if existing:
        return
    admin = User(
        email=settings.ADMIN_EMAIL.lower(),
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        name=settings.ADMIN_NAME,
        role="admin",
    )
    db.add(admin)
    db.commit()
    print(f"[seed] Created admin account: {settings.ADMIN_EMAIL}")


@app.on_event("startup")
def on_startup() -> None:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    # Import models so they're registered with Base before create_all
    from app.models import ChatMessage, ChatSession, Paper, Quiz, User  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_admin(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "name": "AI Exam Helper API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "ok",
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "ai_configured": bool(settings.OPENAI_API_KEY)}


app.include_router(auth_router.router)
app.include_router(papers_router.router)
app.include_router(chat_router.router)
app.include_router(quiz_router.router)
app.include_router(admin_router.router)
