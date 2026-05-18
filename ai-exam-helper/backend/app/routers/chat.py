from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import enforce_ai_quota
from app.core.security import get_current_user
from app.models.chat import ChatMessage, ChatSession
from app.models.paper import Paper
from app.models.user import User
from app.schemas.chat import (
    ChatMessageOut,
    ChatSendRequest,
    ChatSendResponse,
    ChatSessionDetail,
    ChatSessionOut,
)
from app.services.openai_service import chat_completion

router = APIRouter(prefix="/api/chat", tags=["chat"])

MAX_HISTORY_MESSAGES = 20


@router.get("/sessions", response_model=List[ChatSessionOut])
def list_sessions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    db.delete(session)
    db.commit()
    return None


@router.post("/send", response_model=ChatSendResponse)
def send_message(
    payload: ChatSendRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(content) > 4000:
        raise HTTPException(status_code=400, detail="Message too long (max 4000 chars)")

    enforce_ai_quota(user.id)

    # Resolve or create session
    if payload.session_id:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == payload.session_id, ChatSession.user_id == user.id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        title = content[:60] + ("..." if len(content) > 60 else "")
        session = ChatSession(user_id=user.id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)

    # Optional paper context
    paper_context: Optional[str] = None
    if payload.paper_id:
        paper = db.query(Paper).filter(Paper.id == payload.paper_id).first()
        if paper:
            paper_context = (
                f"Paper title: {paper.title}\nSubject: {paper.subject}\n"
                f"Year: {paper.year}\nSemester: {paper.semester or 'N/A'}\n"
                f"Description: {paper.description or 'N/A'}"
            )

    # Save user message
    user_msg = ChatMessage(session_id=session.id, role="user", content=content)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Build history for the model (recent messages only)
    history_msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )
    history_msgs.reverse()
    api_history = [{"role": m.role, "content": m.content} for m in history_msgs]

    assistant_text = chat_completion(api_history, paper_context=paper_context)

    assistant_msg = ChatMessage(session_id=session.id, role="assistant", content=assistant_text)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return ChatSendResponse(
        session_id=session.id,
        user_message=ChatMessageOut.model_validate(user_msg),
        assistant_message=ChatMessageOut.model_validate(assistant_msg),
    )
