"""Data access for finger spelling practice sessions."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from src.models.finger_spelling import FingerPracticeSession, FingerPracticeSessionLetter


class FingerPracticeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_session_by_id(self, session_id: int) -> FingerPracticeSession | None:
        return self.db.get(FingerPracticeSession, session_id)

    def get_session_for_user(self, session_id: int, user_id: uuid.UUID) -> FingerPracticeSession | None:
        stmt = select(FingerPracticeSession).where(
            FingerPracticeSession.id == session_id,
            FingerPracticeSession.user_id == user_id,
        )
        return self.db.scalars(stmt).first()

    def get_session_with_letters(
        self, session_id: int, user_id: uuid.UUID
    ) -> FingerPracticeSession | None:
        stmt = (
            select(FingerPracticeSession)
            .options(selectinload(FingerPracticeSession.session_letters))
            .where(
                FingerPracticeSession.id == session_id,
                FingerPracticeSession.user_id == user_id,
            )
        )
        return self.db.scalars(stmt).unique().first()

    def create_session(
        self,
        *,
        user_id: uuid.UUID,
        lesson_id: int,
        started_at: datetime,
        media_id: int | None = None,
    ) -> FingerPracticeSession:
        session = FingerPracticeSession(
            user_id=user_id,
            lesson_id=lesson_id,
            media_id=media_id,
            started_at=started_at,
        )
        self.db.add(session)
        self.db.flush()
        return session

    def get_session_letter(
        self, session_id: int, letter_id: int
    ) -> FingerPracticeSessionLetter | None:
        stmt = select(FingerPracticeSessionLetter).where(
            FingerPracticeSessionLetter.session_id == session_id,
            FingerPracticeSessionLetter.letter_id == letter_id,
        )
        return self.db.scalars(stmt).first()

    def add_session_letter(
        self,
        *,
        session_id: int,
        letter_id: int,
        accuracy: float | None,
        attempts: int,
        time_spent_seconds: int,
        media_id: int | None = None,
    ) -> FingerPracticeSessionLetter:
        row = FingerPracticeSessionLetter(
            session_id=session_id,
            letter_id=letter_id,
            accuracy=accuracy,
            attempts=attempts,
            time_spent_seconds=time_spent_seconds,
            media_id=media_id,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def upsert_session_letter(
        self,
        *,
        session_id: int,
        letter_id: int,
        accuracy: float | None,
        attempts: int,
        time_spent_seconds: int,
        media_id: int | None = None,
    ) -> FingerPracticeSessionLetter:
        existing = self.get_session_letter(session_id, letter_id)
        if existing is not None:
            existing.accuracy = accuracy
            existing.attempts = max(attempts, existing.attempts or 0)
            existing.time_spent_seconds = max(
                time_spent_seconds, existing.time_spent_seconds or 0
            )
            if media_id is not None:
                existing.media_id = media_id
            self.db.flush()
            return existing

        return self.add_session_letter(
            session_id=session_id,
            letter_id=letter_id,
            accuracy=accuracy,
            attempts=attempts,
            time_spent_seconds=time_spent_seconds,
            media_id=media_id,
        )
