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
    Float,
    ForeignKey,
    Index,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.session import Base


class SentenceSpellingSource(str, Enum):
    """Where a practiced sentence came from."""
    SAMPLE = "sample"
    CUSTOM = "custom"


# ==================== SENTENCES ====================

class SentenceSpellingSentence(Base):
    """Curated sample sentence for guided practice (flat list, admin-managed)."""
    __tablename__ = "sentence_spelling_sentences"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    text_kh: Mapped[str] = mapped_column(Text, nullable=False)
    text_en: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    practice_attempts: Mapped[List["SentenceSpellingPracticeAttempt"]] = relationship(
        back_populates="sentence"
    )

    __table_args__ = (
        UniqueConstraint("text_kh", name="uq_sentence_spelling_sentences_text_kh"),
    )


# ==================== PRACTICE ATTEMPTS ====================

class SentenceSpellingPracticeAttempt(Base):
    """One completed practice session (history log, not a mutable progress row)."""
    __tablename__ = "sentence_spelling_practice_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    source: Mapped[str] = mapped_column(
        SQLEnum(
            SentenceSpellingSource,
            name="sentence_spelling_source",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
    )
    sentence_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("sentence_spelling_sentences.id", ondelete="SET NULL"),
        nullable=True,
    )
    practiced_text: Mapped[str] = mapped_column(Text, nullable=False)
    character_count: Mapped[int] = mapped_column(BigInteger, nullable=False, server_default="0")
    accuracy_percent: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    completed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship(
        back_populates="sentence_spelling_practice_attempts", foreign_keys=[user_id]
    )
    sentence: Mapped[Optional["SentenceSpellingSentence"]] = relationship(
        back_populates="practice_attempts"
    )

    __table_args__ = (
        Index("ix_sentence_spelling_practice_attempts_user_id", "user_id"),
        Index("ix_sentence_spelling_practice_attempts_sentence_id", "sentence_id"),
        Index(
            "ix_sentence_spelling_practice_attempts_user_completed",
            "user_id",
            "completed_at",
        ),
    )
