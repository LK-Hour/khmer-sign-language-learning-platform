"""Data access for sentence-spelling practice attempts (append-only history)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models.sentence_spelling import SentenceSpellingPracticeAttempt, SentenceSpellingSource


class SentencePracticeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_attempt(self, **kwargs: Any) -> SentenceSpellingPracticeAttempt:
        attempt = SentenceSpellingPracticeAttempt(**kwargs)
        self.db.add(attempt)
        self.db.flush()
        return attempt

    def get_most_recent_for_user(
        self, user_id: uuid.UUID
    ) -> SentenceSpellingPracticeAttempt | None:
        stmt = (
            select(SentenceSpellingPracticeAttempt)
            .where(SentenceSpellingPracticeAttempt.user_id == user_id)
            .order_by(SentenceSpellingPracticeAttempt.completed_at.desc())
            .limit(1)
        )
        return self.db.scalars(stmt).first()

    def list_recent_distinct_texts(
        self,
        user_id: uuid.UUID,
        *,
        source: SentenceSpellingSource,
        limit: int = 5,
    ) -> list[SentenceSpellingPracticeAttempt]:
        """Most recent attempts for `user_id`/`source`, one per distinct
        `practiced_text` (the latest `completed_at` wins repeats)."""
        row_number = (
            func.row_number()
            .over(
                partition_by=SentenceSpellingPracticeAttempt.practiced_text,
                order_by=SentenceSpellingPracticeAttempt.completed_at.desc(),
            )
            .label("row_number")
        )
        ranked = (
            select(SentenceSpellingPracticeAttempt, row_number)
            .where(
                SentenceSpellingPracticeAttempt.user_id == user_id,
                SentenceSpellingPracticeAttempt.source == source,
            )
            .subquery()
        )
        stmt = (
            select(SentenceSpellingPracticeAttempt)
            .join(ranked, SentenceSpellingPracticeAttempt.id == ranked.c.id)
            .where(ranked.c.row_number == 1)
            .order_by(SentenceSpellingPracticeAttempt.completed_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())
