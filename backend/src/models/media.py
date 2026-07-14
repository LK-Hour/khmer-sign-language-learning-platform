"""
Centralized media storage model shared across multiple modules.

Used by:
- Finger spelling (letters, exercises, options)
- Sign language (words, exercises, options, practice sessions)
- User contributions
"""

from datetime import datetime
from enum import Enum
from typing import List, TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, Enum as SQLEnum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.session import Base

if TYPE_CHECKING:
    from .finger_spelling import (
        FingerLetterMedia,
        FingerExercise,
        FingerExerciseOption,
        FingerPracticeMedia,
    )
    from .word_detection import (
        WordDetectionWordMedia,
        WordDetectionExercise,
        WordDetectionExerciseOption,
        WordDetectionPracticeMedia,
    )


class MediaType(str, Enum):
    """Media file types."""
    VIDEO = "video"
    GIF = "gif"
    IMAGE = "image"


class Media(Base):
    """
    Centralized media storage for all media content.
    
    Shared across:
    - Finger spelling: letters, exercises, options
    - Sign language: words, exercises, options, practice sessions
    - User contributions and practice recordings
    """
    __tablename__ = "medias"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    media_type: Mapped[str] = mapped_column(
        SQLEnum(MediaType, name="media_type", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships - Finger Spelling
    finger_letter_medias: Mapped[List["FingerLetterMedia"]] = relationship(
        back_populates="media", cascade="all, delete-orphan"
    )
    finger_exercises: Mapped[List["FingerExercise"]] = relationship(
        back_populates="media", foreign_keys="FingerExercise.media_id"
    )
    finger_exercise_options: Mapped[List["FingerExerciseOption"]] = relationship(
        back_populates="media", foreign_keys="FingerExerciseOption.media_id"
    )
    
    # Relationships - Word Detection
    word_detection_word_medias: Mapped[List["WordDetectionWordMedia"]] = relationship(
        back_populates="media", cascade="all, delete-orphan"
    )
    word_detection_exercises: Mapped[List["WordDetectionExercise"]] = relationship(
        back_populates="media", foreign_keys="WordDetectionExercise.media_id"
    )
    word_detection_exercise_options: Mapped[List["WordDetectionExerciseOption"]] = relationship(
        back_populates="media", foreign_keys="WordDetectionExerciseOption.media_id"
    )

    # Relationships - Practice
    finger_practice_medias: Mapped[List["FingerPracticeMedia"]] = relationship(
        back_populates="media"
    )
    word_detection_practice_medias: Mapped[List["WordDetectionPracticeMedia"]] = relationship(
        back_populates="media"
    )
