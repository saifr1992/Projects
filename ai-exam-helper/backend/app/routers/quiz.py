import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import enforce_ai_quota
from app.core.security import get_current_user
from app.models.paper import Paper
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.quiz import (
    QuizGenerateRequest,
    QuizHistoryItem,
    QuizOut,
    QuizQuestionPublic,
    QuizSubmitRequest,
    QuizSubmitResponse,
)
from app.services.openai_service import generate_quiz_questions

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


def _quiz_to_out(quiz: Quiz) -> QuizOut:
    questions = json.loads(quiz.questions_json or "[]")
    public_qs = [QuizQuestionPublic(question=q["question"], options=q["options"]) for q in questions]
    return QuizOut(
        id=quiz.id,
        paper_id=quiz.paper_id,
        topic=quiz.topic,
        questions=public_qs,
        total=quiz.total,
        submitted=bool(quiz.submitted),
        score=quiz.score,
        created_at=quiz.created_at,
    )


@router.post("/generate", response_model=QuizOut)
def generate_quiz(
    payload: QuizGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    paper_title = None
    paper_context = None
    if payload.paper_id:
        paper = db.query(Paper).filter(Paper.id == payload.paper_id).first()
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        paper_title = paper.title
        paper_context = (
            f"Subject: {paper.subject}\nYear: {paper.year}\n"
            f"Semester: {paper.semester or 'N/A'}\n"
            f"Description: {paper.description or 'N/A'}"
        )

    if not paper_title and not payload.topic:
        raise HTTPException(status_code=400, detail="Provide a paper_id or a topic")

    enforce_ai_quota(user.id)

    questions = generate_quiz_questions(
        topic=payload.topic,
        paper_title=paper_title,
        paper_context=paper_context,
        num_questions=payload.num_questions,
        difficulty=payload.difficulty,
    )

    quiz = Quiz(
        user_id=user.id,
        paper_id=payload.paper_id,
        topic=payload.topic,
        questions_json=json.dumps(questions),
        total=len(questions),
        submitted=0,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return _quiz_to_out(quiz)


@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return _quiz_to_out(quiz)


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.submitted:
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    questions = json.loads(quiz.questions_json or "[]")
    if len(payload.answers) != len(questions):
        raise HTTPException(
            status_code=400,
            detail=f"Expected {len(questions)} answers, got {len(payload.answers)}",
        )

    results = []
    correct = 0
    for q, selected in zip(questions, payload.answers):
        is_correct = selected == q["correct_index"]
        if is_correct:
            correct += 1
        results.append(
            {
                "question": q["question"],
                "options": q["options"],
                "selected": selected,
                "correct_index": q["correct_index"],
                "is_correct": is_correct,
                "explanation": q.get("explanation", ""),
            }
        )

    score = round((correct / len(questions)) * 100, 2)
    quiz.answers_json = json.dumps(payload.answers)
    quiz.score = score
    quiz.submitted = 1
    db.commit()

    return QuizSubmitResponse(
        quiz_id=quiz.id,
        score=score,
        correct=correct,
        total=len(questions),
        results=results,
    )


@router.get("", response_model=List[QuizHistoryItem])
def quiz_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        db.query(Quiz)
        .filter(Quiz.user_id == user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )
    return [
        QuizHistoryItem(
            id=r.id,
            topic=r.topic,
            paper_id=r.paper_id,
            total=r.total,
            score=r.score,
            submitted=bool(r.submitted),
            created_at=r.created_at,
        )
        for r in rows
    ]
