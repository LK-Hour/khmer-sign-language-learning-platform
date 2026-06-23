from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import BigInteger, DateTime, Enum as SQLEnum, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from src.db.session import Base


class FeedbackMood(str, Enum):
    VERY_BAD = "very_bad"
    BAD = "bad"
    OKAY = "okay"
    GOOD = "good"
    EXCELLENT = "excellent"


class FeedbackType(str, Enum):
    FINGER_SPELLING = "finger_spelling"
    WORDS = "words"


class LessonFeedback(Base):
    __tablename__ = "lesson_feedback"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    type: Mapped[FeedbackType] = mapped_column(
        SQLEnum(
            FeedbackType,
            name="feedback_type",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    category: Mapped[str] = mapped_column(String(255), nullable=False)
    lesson_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("finger_lessons.id"),
        nullable=False,
    )
    characteristic: Mapped[str] = mapped_column(String(255), nullable=False)
    mood: Mapped[FeedbackMood] = mapped_column(
        SQLEnum(
            FeedbackMood,
            name="feedback_mood",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_lesson_feedback_lesson_id", "lesson_id"),
    )