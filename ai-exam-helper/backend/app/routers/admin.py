from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.models.paper import Paper
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.auth import UserOut

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/stats")
def stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return {
        "users": db.query(User).count(),
        "students": db.query(User).filter(User.role == "student").count(),
        "papers": db.query(Paper).count(),
        "quizzes": db.query(Quiz).count(),
    }


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None
