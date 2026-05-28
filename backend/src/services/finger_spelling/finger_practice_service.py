"""Business logic for finger spelling practice sessions."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from src.models.finger_spelling import FingerPracticeSession
from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.repositories.finger_spelling.finger_practice_repository import FingerPracticeRepository
from src.services.finger_spelling.finger_progress_service import FingerProgressService


def _utc_now_naive() -> datetime:
    """Return UTC now as naive datetime for current DB column type."""
    return datetime.now(UTC).replace(tzinfo=None)


@dataclass
class PracticeLetterSubmitResult:
    session_id: int
    letter_id: int
    accuracy: float | None


@dataclass
class PracticeEndResult:
    session: FingerPracticeSession
    average_accuracy: float | None
    peak_accuracy: float | None
    duration_seconds: int


@dataclass
class PracticeAccuracyResult:
    session: FingerPracticeSession
    average_accuracy: float | None
    peak_accuracy: float | None
    samples: int


class FingerPracticeService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.practice = FingerPracticeRepository(db)
        self.curriculum = FingerCurriculumRepository(db)
        self.progress = FingerProgressService(db)

    def start_session(
        self,
        *,
        user_id: uuid.UUID,
        lesson_id: int,
        media_id: int | None = None,
    ) -> FingerPracticeSession | None:
        if self.curriculum.get_lesson_by_id(lesson_id, active_only=True) is None:
            return None

        session = self.practice.create_session(
            user_id=user_id,
            lesson_id=lesson_id,
            started_at=_utc_now_naive(),
            media_id=media_id,
        )
        self.db.commit()
        self.db.refresh(session)
        return session

    def submit_letter(
        self,
        *,
        user_id: uuid.UUID,
        session_id: int,
        letter_id: int,
        accuracy: float | None,
        attempts: int = 1,
        time_spent_seconds: int = 0,
        media_id: int | None = None,
    ) -> PracticeLetterSubmitResult | None:
        session = self.practice.get_session_for_user(session_id, user_id)
        if session is None or session.is_completed:
            return None

        if not self.curriculum.letter_belongs_to_lesson(
            session.lesson_id, letter_id, active_only=True
        ):
            return None

        self.practice.upsert_session_letter(
            session_id=session_id,
            letter_id=letter_id,
            accuracy=accuracy,
            attempts=max(attempts, 0),
            time_spent_seconds=max(time_spent_seconds, 0),
            media_id=media_id,
        )
        self.db.commit()

        return PracticeLetterSubmitResult(
            session_id=session_id,
            letter_id=letter_id,
            accuracy=accuracy,
        )

    def end_session(
        self,
        *,
        user_id: uuid.UUID,
        session_id: int,
        update_lesson_progress: bool = True,
    ) -> PracticeEndResult | None:
        session = self.practice.get_session_with_letters(session_id, user_id)
        if session is None or session.is_completed:
            return None

        ended_at = _utc_now_naive()
        session.ended_at = ended_at
        session.duration = max(int((ended_at - session.started_at).total_seconds()), 0)
        session.is_completed = True

        accuracies = [
            float(row.accuracy)
            for row in session.session_letters
            if row.accuracy is not None
        ]
        average_accuracy = round(sum(accuracies) / len(accuracies), 2) if accuracies else None
        peak_accuracy = round(max(accuracies), 2) if accuracies else None

        session.average_accuracy = average_accuracy
        session.peak_accuracy = peak_accuracy

        if (
            update_lesson_progress
            and peak_accuracy is not None
            and peak_accuracy >= FingerProgressService.PRACTICE_PASS_ACCURACY
        ):
            self.progress.complete_lesson(
                user_id,
                session.lesson_id,
                peak_accuracy=peak_accuracy,
                time_spent=session.duration,
            )
        else:
            self.db.commit()

        self.db.refresh(session)
        return PracticeEndResult(
            session=session,
            average_accuracy=average_accuracy,
            peak_accuracy=peak_accuracy,
            duration_seconds=session.duration,
        )

    def get_session_accuracy(
        self,
        *,
        user_id: uuid.UUID,
        session_id: int,
    ) -> PracticeAccuracyResult | None:
        session = self.practice.get_session_with_letters(session_id, user_id)
        if session is None:
            return None

        accuracies = [
            float(row.accuracy) for row in session.session_letters if row.accuracy is not None
        ]
        average_accuracy = round(sum(accuracies) / len(accuracies), 2) if accuracies else None
        peak_accuracy = round(max(accuracies), 2) if accuracies else None
        return PracticeAccuracyResult(
            session=session,
            average_accuracy=average_accuracy,
            peak_accuracy=peak_accuracy,
            samples=len(accuracies),
        )
