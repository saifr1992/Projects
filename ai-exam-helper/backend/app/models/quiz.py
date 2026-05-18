from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id"), nullable=True, index=True)
    topic: Mapped[str] = mapped_column(String(255), nullable=True)
    questions_json: Mapped[str] = mapped_column(Text, nullable=False)  # serialized questions
    answers_json: Mapped[str] = mapped_column(Text, nullable=True)  # user's submitted answers
    score: Mapped[float] = mapped_column(Float, nullable=True)
    total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    submitted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # 0/1
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = relationship("User", back_populates="quizzes")
    paper = relationship("Paper", back_populates="quizzes")
