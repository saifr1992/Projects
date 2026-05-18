from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class QuizGenerateRequest(BaseModel):
    paper_id: Optional[int] = None
    topic: Optional[str] = Field(default=None, max_length=200)
    num_questions: int = Field(default=5, ge=3, le=15)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    explanation: Optional[str] = None


class QuizQuestionPublic(BaseModel):
    """Question shape returned to the student (no correct answer)."""
    question: str
    options: List[str]


class QuizOut(BaseModel):
    id: int
    paper_id: Optional[int]
    topic: Optional[str]
    questions: List[QuizQuestionPublic]
    total: int
    submitted: bool
    score: Optional[float] = None
    created_at: datetime


class QuizSubmitRequest(BaseModel):
    answers: List[int]  # selected option index per question


class QuizSubmitResponse(BaseModel):
    quiz_id: int
    score: float
    correct: int
    total: int
    results: List[dict]  # per-question: {question, selected, correct_index, is_correct, explanation}


class QuizHistoryItem(BaseModel):
    id: int
    topic: Optional[str]
    paper_id: Optional[int]
    total: int
    score: Optional[float]
    submitted: bool
    created_at: datetime
