from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, List, Optional
from uuid import uuid4

if TYPE_CHECKING:
    from src.models.user import User

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.session import Base
from src.models.media import Media


class FingerExerciseType(str, Enum):
    """Exercise question types."""
    MULTIPLE_CHOICE = "multiple_choice"
    FREE_FORM = "free_form"
    IMAGE_SELECT = "image_select"
    MATCHING = "matching"


# ==================== CURRICULUM HIERARCHY ====================

class FingerUnit(Base):
    """Top-level curriculum container (e.g., Main Consonants)."""
    __tablename__ = "finger_units"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    name_kh: Mapped[str] = mapped_column(String(255), nullable=False)
    description_en: Mapped[Optional[str]] = mapped_column(Text)
    description_kh: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    chapters: Mapped[List["FingerChapter"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("name_kh", name="uq_finger_units_name_kh"),
        UniqueConstraint("order_index", name="uq_finger_units_order_index"),
        Index("ix_finger_units_order_index", "order_index"),
    )


class FingerChapter(Base):
    """Chapter within a unit (e.g., ក ខ គ ឃ ង)."""
    __tablename__ = "finger_chapters"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    unit_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("finger_units.id"), nullable=False)
    name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    name_kh: Mapped[str] = mapped_column(String(255), nullable=False)
    description_en: Mapped[Optional[str]] = mapped_column(Text)
    description_kh: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    unit: Mapped["FingerUnit"] = relationship(back_populates="chapters")
    lessons: Mapped[List["FingerLesson"]] = relationship(
        back_populates="chapter", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("unit_id", "order_index", name="uq_finger_chapters_unit_id_order_index"),
        Index("ix_finger_chapters_unit_id", "unit_id"),
        Index("ix_finger_chapters_order_index", "order_index"),
    )


class FingerLesson(Base):
    """Individual lesson (may contain multiple letters via junction table)."""
    __tablename__ = "finger_lessons"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    chapter_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("finger_chapters.id"), nullable=False)
    name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    name_kh: Mapped[str] = mapped_column(String(255), nullable=False)
    description_en: Mapped[Optional[str]] = mapped_column(Text)
    description_kh: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    chapter: Mapped["FingerChapter"] = relationship(back_populates="lessons")
    lesson_letters: Mapped[List["FingerLessonLetter"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    user_progress: Mapped[List["FingerUserLessonProgress"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    exercises: Mapped[List["FingerExercise"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("chapter_id", "order_index", name="uq_finger_lessons_chapter_id_order_index"),
        Index("ix_finger_lessons_chapter_id", "chapter_id"),
        Index("ix_finger_lessons_order_index", "order_index"),
    )


# ==================== LETTERS ====================

class FingerLetter(Base):
    """Letter definition with metadata."""
    __tablename__ = "finger_letters"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    letter_en: Mapped[Optional[str]] = mapped_column(String(100))
    letter_kh: Mapped[str] = mapped_column(String(100), nullable=False)
    description_en: Mapped[Optional[str]] = mapped_column(Text)
    description_kh: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    lesson_letters: Mapped[List["FingerLessonLetter"]] = relationship(
        back_populates="letter", cascade="all, delete-orphan"
    )
    letter_medias: Mapped[List["FingerLetterMedia"]] = relationship(
        back_populates="letter", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("letter_kh", name="uq_finger_letters_letter_kh"),
    )


class FingerLessonLetter(Base):
    """Junction table: links lessons to letters with order."""
    __tablename__ = "finger_lesson_letters"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("finger_lessons.id"), nullable=False)
    letter_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("finger_letters.id"), nullable=False)
    order_index: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    lesson: Mapped["FingerLesson"] = relationship(back_populates="lesson_letters")
    letter: Mapped["FingerLetter"] = relationship(back_populates="lesson_letters")

    __table_args__ = (
        UniqueConstraint("lesson_id", "letter_id", name="uq_finger_lesson_letters_lesson_letter"),
        UniqueConstraint("lesson_id", "order_index", name="uq_finger_lesson_letters_lesson_order"),
        Index("ix_finger_lesson_letters_lesson_id", "lesson_id"),
        Index("ix_finger_lesson_letters_letter_id", "letter_id"),
        Index("ix_finger_lesson_letters_order_index", "order_index"),
    )


class FingerLetterMedia(Base):
    """Links letters to media (images/videos)."""
    __tablename__ = "finger_letter_medias"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    letter_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("finger_letters.id"), nullable=False)
    media_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("medias.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    letter: Mapped["FingerLetter"] = relationship(back_populates="letter_medias")
    media: Mapped["Media"] = relationship(back_populates="finger_letter_medias")

    __table_args__ = (
        Index("ix_finger_letter_medias_letter_id", "letter_id"),
        Index("ix_finger_letter_medias_media_id", "media_id"),
    )


# ==================== EXERCISES ====================

class FingerExercise(Base):
    """Lesson exercise/question (multiple choice, free form, image select)."""
    __tablename__ = "finger_exercises"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("finger_lessons.id"), nullable=False)
    question_en: Mapped[str] = mapped_column(Text, nullable=False)
    question_kh: Mapped[str] = mapped_column(Text, nullable=False)
    exercise_type: Mapped[str] = mapped_column(
        SQLEnum(
            FingerExerciseType,
            name="finger_exercise_type",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
    )
    media_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("medias.id"))
    correct_answer: Mapped[Optional[str]] = mapped_column(Text)
    explanation_en: Mapped[Optional[str]] = mapped_column(Text)
    explanation_kh: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    lesson: Mapped["FingerLesson"] = relationship(back_populates="exercises")
    media: Mapped[Optional["Media"]] = relationship(
        back_populates="finger_exercises", foreign_keys=[media_id]
    )
    options: Mapped[List["FingerExerciseOption"]] = relationship(
        back_populates="exercise", cascade="all, delete-orphan"
    )
    user_results: Mapped[List["FingerUserExerciseResult"]] = relationship(
        back_populates="exercise", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("lesson_id", "order_index", name="uq_finger_exercises_lesson_order"),
        Index("ix_finger_exercises_lesson_id", "lesson_id"),
        Index("ix_finger_exercises_media_id", "media_id"),
        Index("ix_finger_exercises_order_index", "order_index"),
    )


class FingerExerciseOption(Base):
    """Exercise option (for multiple_choice, image_select, matching)."""
    __tablename__ = "finger_exercise_options"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    exercise_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("finger_exercises.id"), nullable=False)
    option_text_en: Mapped[Optional[str]] = mapped_column(String(500))
    option_text_kh: Mapped[Optional[str]] = mapped_column(String(500))
    media_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("medias.id"))
    is_correct: Mapped[bool] = mapped_column(Boolean, server_default="false")
    points: Mapped[int] = mapped_column(BigInteger, default=1)
    order_index: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    exercise: Mapped["FingerExercise"] = relationship(back_populates="options")
    media: Mapped[Optional["Media"]] = relationship(
        back_populates="finger_exercise_options", foreign_keys=[media_id]
    )
    user_results: Mapped[List["FingerUserExerciseResult"]] = relationship(
        back_populates="selected_option", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("exercise_id", "order_index", name="uq_finger_exercise_options_exercise_order"),
        Index("ix_finger_exercise_options_exercise_id", "exercise_id"),
        Index("ix_finger_exercise_options_media_id", "media_id"),
        Index("ix_finger_exercise_options_order_index", "order_index"),
    )


# ==================== USER PROGRESS ====================

class FingerUserLessonProgress(Base):
    """Per-user lesson completion and practice tracking."""
    __tablename__ = "finger_user_lesson_progress"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    finger_lesson_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("finger_lessons.id"), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, server_default="false")
    is_locked: Mapped[bool] = mapped_column(Boolean, server_default="true")
    attempts: Mapped[int] = mapped_column(BigInteger, default=0, server_default="0")
    last_practiced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    lesson: Mapped["FingerLesson"] = relationship(back_populates="user_progress")
    user: Mapped[User] = relationship(back_populates="lesson_progress", foreign_keys=[user_id])
    exercise_results: Mapped[List["FingerUserExerciseResult"]] = relationship(
        back_populates="progress", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "finger_lesson_id", name="uq_finger_user_lesson_progress_user_lesson"),
        Index("ix_finger_user_lesson_progress_user_id", "user_id"),
        Index("ix_finger_user_lesson_progress_lesson_id", "finger_lesson_id"),
    )


class FingerUserExerciseResult(Base):
    """Individual lesson exercise attempt result."""
    __tablename__ = "finger_user_exercise_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    progress_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("finger_user_lesson_progress.id"), nullable=False
    )
    finger_exercise_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("finger_exercises.id"), nullable=False)
    selected_option_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("finger_exercise_options.id"))
    selected_answer: Mapped[Optional[str]] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean, server_default="false")
    time_taken: Mapped[int] = mapped_column(BigInteger, default=0)  # in seconds
    attempt_number: Mapped[int] = mapped_column(BigInteger, default=1)
    score: Mapped[int] = mapped_column(BigInteger, default=0, server_default="0")
    answered_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    exercise: Mapped["FingerExercise"] = relationship(back_populates="user_results")
    user: Mapped[User] = relationship(back_populates="exercise_results", foreign_keys=[user_id])
    progress: Mapped["FingerUserLessonProgress"] = relationship(back_populates="exercise_results")
    selected_option: Mapped[Optional["FingerExerciseOption"]] = relationship(
        back_populates="user_results", foreign_keys=[selected_option_id]
    )

    __table_args__ = (
        Index("ix_finger_user_exercise_results_user_id", "user_id"),
        Index("ix_finger_user_exercise_results_progress_id", "progress_id"),
        Index("ix_finger_user_exercise_results_exercise_id", "finger_exercise_id"),
    )
