import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.paper import Paper
from app.models.user import User
from app.schemas.paper import PaperOut

router = APIRouter(prefix="/api/papers", tags=["papers"])

ALLOWED_EXTENSIONS = {".pdf"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@router.get("", response_model=List[PaperOut])
def list_papers(
    q: Optional[str] = None,
    subject: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Paper)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Paper.title.ilike(like), Paper.description.ilike(like)))
    if subject:
        query = query.filter(Paper.subject.ilike(f"%{subject}%"))
    if year:
        query = query.filter(Paper.year == year)
    return query.order_by(Paper.created_at.desc()).all()


@router.get("/subjects", response_model=List[str])
def list_subjects(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.query(Paper.subject).distinct().all()
    return sorted({r[0] for r in rows if r[0]})


@router.post("", response_model=PaperOut, status_code=201)
async def upload_paper(
    title: str = Form(...),
    subject: str = Form(...),
    year: int = Form(...),
    semester: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 25 MB)")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}{ext}"
    full_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(full_path, "wb") as fh:
        fh.write(contents)

    paper = Paper(
        title=title,
        subject=subject,
        year=year,
        semester=semester,
        description=description,
        file_path=full_path,
        file_name=file.filename or safe_name,
        uploaded_by=admin.id,
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper


@router.get("/{paper_id}", response_model=PaperOut)
def get_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@router.get("/{paper_id}/download")
def download_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if not os.path.exists(paper.file_path):
        raise HTTPException(status_code=404, detail="File missing on server")
    return FileResponse(paper.file_path, media_type="application/pdf", filename=paper.file_name)


@router.delete("/{paper_id}", status_code=204)
def delete_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if paper.file_path and os.path.exists(paper.file_path):
        try:
            os.remove(paper.file_path)
        except OSError:
            pass
    db.delete(paper)
    db.commit()
    return None
