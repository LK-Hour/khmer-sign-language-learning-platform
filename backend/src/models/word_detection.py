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
from src.models.publishable import PublishableMixin


class WordDetectionExerciseType(str, Enum):
    """Exercise question types."""
    MULTIPLE_CHOICE = "multiple_choice"
    FREE_FORM = "free_form"
    IMAGE_SELECT = "image_select"
    MATCHING = "matching"


# ==================== CURRICULUM HIERARCHY ====================

class WordDetectionUnit(PublishableMixin, Base):
    """Top-level curriculum container (category, e.g. Education, Home)."""
    __tablename__ = "word_detection_units"

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
    chapters: Mapped[List["WordDetectionChapter"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("name_kh", name="uq_word_detection_units_name_kh"),
        UniqueConstraint("order_index", name="uq_word_detection_units_order_index"),
        Index("ix_word_detection_units_order_index", "order_index"),
    )


class WordDetectionChapter(PublishableMixin, Base):
    """Chapter within a unit. `level` indicates difficulty of the words."""
    __tablename__ = "word_detection_chapters"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    unit_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("word_detection_units.id"), nullable=False)
    name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    name_kh: Mapped[str] = mapped_column(String(255), nullable=False)
    description_en: Mapped[Optional[str]] = mapped_column(Text)
    description_kh: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    level: Mapped[int] = mapped_column(BigInteger, nullable=False, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    unit: Mapped["WordDetectionUnit"] = relationship(back_populates="chapters")
    lessons: Mapped[List["WordDetectionLesson"]] = relationship(
        back_populates="chapter", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("unit_id", "order_index", name="uq_word_detection_chapters_unit_id_order_index"),
        Index("ix_word_detection_chapters_unit_id", "unit_id"),
        Index("ix_word_detection_chapters_order_index", "order_index"),
    )


class WordDetectionLesson(PublishableMixin, Base):
    """Individual lesson — teaches one Khmer word via its sign."""
    __tablename__ = "word_detection_lessons"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    chapter_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("word_detection_chapters.id"), nullable=False)
    name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    name_kh: Mapped[str] = mapped_column(String(255), nullable=False)
    description_en: Mapped[Optional[str]] = mapped_column(Text)
    description_kh: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    chapter: Mapped["WordDetectionChapter"] = relationship(back_populates="lessons")
    lesson_words: Mapped[List["WordDetectionLessonWord"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    user_progress: Mapped[List["WordDetectionUserLessonProgress"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    exercises: Mapped[List["WordDetectionExercise"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    contributions: Mapped[List["WordDetectionContribution"]] = relationship(
        back_populates="lesson"
    )

    __table_args__ = (
        UniqueConstraint("chapter_id", "order_index", name="uq_word_detection_lessons_chapter_id_order_index"),
        Index("ix_word_detection_lessons_chapter_id", "chapter_id"),
        Index("ix_word_detection_lessons_order_index", "order_index"),
    )


# ==================== WORDS ====================

class WordDetectionWord(Base):
    """Word definition with metadata. `word_kh` matches the dataset folder name."""
    __tablename__ = "word_detection_words"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    word_en: Mapped[Optional[str]] = mapped_column(String(100))
    word_kh: Mapped[str] = mapped_column(String(100), nullable=False)
    description_en: Mapped[Optional[str]] = mapped_column(Text)
    description_kh: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    lesson_words: Mapped[List["WordDetectionLessonWord"]] = relationship(
        back_populates="word", cascade="all, delete-orphan"
    )
    word_medias: Mapped[List["WordDetectionWordMedia"]] = relationship(
        back_populates="word", cascade="all, delete-orphan"
    )
    contributions: Mapped[List["WordDetectionContribution"]] = relationship(
        back_populates="word", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("word_kh", name="uq_word_detection_words_word_kh"),
    )


class WordDetectionLessonWord(Base):
    """Junction table: links lessons to words with order."""
    __tablename__ = "word_detection_lesson_words"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("word_detection_lessons.id"), nullable=False)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("word_detection_words.id"), nullable=False)
    order_index: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    lesson: Mapped["WordDetectionLesson"] = relationship(back_populates="lesson_words")
    word: Mapped["WordDetectionWord"] = relationship(back_populates="lesson_words")

    __table_args__ = (
        UniqueConstraint("lesson_id", "word_id", name="uq_word_detection_lesson_words_lesson_word"),
        UniqueConstraint("lesson_id", "order_index", name="uq_word_detection_lesson_words_lesson_order"),
        Index("ix_word_detection_lesson_words_lesson_id", "lesson_id"),
        Index("ix_word_detection_lesson_words_word_id", "word_id"),
        Index("ix_word_detection_lesson_words_order_index", "order_index"),
    )


class WordDetectionWordMedia(Base):
    """Links words to media (images/videos)."""
    __tablename__ = "word_detection_word_medias"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("word_detection_words.id"), nullable=False)
    media_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("medias.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    word: Mapped["WordDetectionWord"] = relationship(back_populates="word_medias")
    media: Mapped["Media"] = relationship(back_populates="word_detection_word_medias")

    __table_args__ = (
        Index("ix_word_detection_word_medias_word_id", "word_id"),
        Index("ix_word_detection_word_medias_media_id", "media_id"),
    )


# ==================== EXERCISES ====================

class WordDetectionExercise(PublishableMixin, Base):
    """Lesson exercise/question (multiple choice, free form, image select)."""
    __tablename__ = "word_detection_exercises"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("word_detection_lessons.id"), nullable=False)
    question_en: Mapped[str] = mapped_column(Text, nullable=False)
    question_kh: Mapped[str] = mapped_column(Text, nullable=False)
    exercise_type: Mapped[str] = mapped_column(
        SQLEnum(
            WordDetectionExerciseType,
            name="word_detection_exercise_type",
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
    lesson: Mapped["WordDetectionLesson"] = relationship(back_populates="exercises")
    media: Mapped[Optional["Media"]] = relationship(
        back_populates="word_detection_exercises", foreign_keys=[media_id]
    )
    options: Mapped[List["WordDetectionExerciseOption"]] = relationship(
        back_populates="exercise", cascade="all, delete-orphan"
    )
    user_results: Mapped[List["WordDetectionUserExerciseResult"]] = relationship(
        back_populates="exercise", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("lesson_id", "order_index", name="uq_word_detection_exercises_lesson_order"),
        Index("ix_word_detection_exercises_lesson_id", "lesson_id"),
        Index("ix_word_detection_exercises_media_id", "media_id"),
        Index("ix_word_detection_exercises_order_index", "order_index"),
    )


class WordDetectionExerciseOption(Base):
    """Exercise option (for multiple_choice, image_select, matching)."""
    __tablename__ = "word_detection_exercise_options"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    exercise_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("word_detection_exercises.id"), nullable=False)
    option_text_en: Mapped[Optional[str]] = mapped_column(String(500))
    option_text_kh: Mapped[Optional[str]] = mapped_column(String(500))
    media_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("medias.id"))
    is_correct: Mapped[bool] = mapped_column(Boolean, server_default="false")
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    points: Mapped[int] = mapped_column(BigInteger, default=1)
    order_index: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    exercise: Mapped["WordDetectionExercise"] = relationship(back_populates="options")
    media: Mapped[Optional["Media"]] = relationship(
        back_populates="word_detection_exercise_options", foreign_keys=[media_id]
    )
    user_results: Mapped[List["WordDetectionUserExerciseResult"]] = relationship(
        back_populates="selected_option", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("exercise_id", "order_index", name="uq_word_detection_exercise_options_exercise_order"),
        Index("ix_word_detection_exercise_options_exercise_id", "exercise_id"),
        Index("ix_word_detection_exercise_options_media_id", "media_id"),
        Index("ix_word_detection_exercise_options_order_index", "order_index"),
    )


# ==================== USER PROGRESS ====================

class WordDetectionUserLessonProgress(Base):
    """Per-user lesson completion and practice tracking."""
    __tablename__ = "word_detection_user_lesson_progress"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    word_detection_lesson_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("word_detection_lessons.id"), nullable=False
    )
    is_completed: Mapped[bool] = mapped_column(Boolean, server_default="false")
    is_locked: Mapped[bool] = mapped_column(Boolean, server_default="true")
    attempts: Mapped[int] = mapped_column(BigInteger, default=0, server_default="0")
    last_practiced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    lesson: Mapped["WordDetectionLesson"] = relationship(back_populates="user_progress")
    user: Mapped["User"] = relationship(back_populates="word_detection_lesson_progress", foreign_keys=[user_id])
    exercise_results: Mapped[List["WordDetectionUserExerciseResult"]] = relationship(
        back_populates="progress", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "word_detection_lesson_id",
            name="uq_word_detection_user_lesson_progress_user_lesson",
        ),
        Index("ix_word_detection_user_lesson_progress_user_id", "user_id"),
        Index("ix_word_detection_user_lesson_progress_lesson_id", "word_detection_lesson_id"),
    )


class WordDetectionUserExerciseResult(Base):
    """Individual lesson exercise attempt result."""
    __tablename__ = "word_detection_user_exercise_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    progress_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("word_detection_user_lesson_progress.id"), nullable=False
    )
    word_detection_exercise_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("word_detection_exercises.id"), nullable=False
    )
    selected_option_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("word_detection_exercise_options.id")
    )
    selected_answer: Mapped[Optional[str]] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean, server_default="false")
    time_taken: Mapped[int] = mapped_column(BigInteger, default=0)  # in seconds
    attempt_number: Mapped[int] = mapped_column(BigInteger, default=1)
    score: Mapped[int] = mapped_column(BigInteger, default=0, server_default="0")
    answered_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    exercise: Mapped["WordDetectionExercise"] = relationship(back_populates="user_results")
    user: Mapped[User] = relationship(
        back_populates="word_detection_exercise_results", foreign_keys=[user_id]
    )
    progress: Mapped["WordDetectionUserLessonProgress"] = relationship(back_populates="exercise_results")
    selected_option: Mapped[Optional["WordDetectionExerciseOption"]] = relationship(
        back_populates="user_results", foreign_keys=[selected_option_id]
    )

    __table_args__ = (
        Index("ix_word_detection_user_exercise_results_user_id", "user_id"),
        Index("ix_word_detection_user_exercise_results_progress_id", "progress_id"),
        Index("ix_word_detection_user_exercise_results_exercise_id", "word_detection_exercise_id"),
    )


# ==================== CONTRIBUTIONS ====================

class WordDetectionContribution(Base):
    """User-submitted sign language contributions for words."""
    __tablename__ = "word_detection_contributions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    guest_id: Mapped[Optional[str]] = mapped_column(String(100))
    word_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("word_detection_words.id"), nullable=False)
    word_detection_lesson_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("word_detection_lessons.id")
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    media_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("medias.id"))
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    review_notes: Mapped[Optional[str]] = mapped_column(Text)
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text)
    consent_version: Mapped[str] = mapped_column(String(50), nullable=False)
    consent_given: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        back_populates="word_detection_contributions",
        foreign_keys=[user_id],
    )
    word: Mapped["WordDetectionWord"] = relationship(back_populates="contributions")
    lesson: Mapped[Optional["WordDetectionLesson"]] = relationship(back_populates="contributions")
    media: Mapped[Optional["Media"]] = relationship(
        back_populates="word_detection_contributions",
        foreign_keys=[media_id],
    )
    reviewer: Mapped[Optional["User"]] = relationship(foreign_keys=[reviewed_by])

    __table_args__ = (
        Index("ix_word_detection_contributions_word_id", "word_id"),
        Index("ix_word_detection_contributions_lesson_id", "word_detection_lesson_id"),
        Index("ix_word_detection_contributions_media_id", "media_id"),
        Index("ix_word_detection_contributions_status", "status"),
        Index("ix_word_detection_contributions_guest_id", "guest_id"),
    )
