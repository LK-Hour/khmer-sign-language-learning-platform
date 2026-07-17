"""Business logic for word detection lesson progress."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from src.models.word_detection import WordDetectionUserLessonProgress
from src.repositories.word_detection.word_detection_progress_repository import (
    WordDetectionProgressRepository,
)
from src.services.word_detection.word_detection_locking_service import (
    WordDetectionLockingService,
)


def _utc_now_naive() -> datetime:
    """Return current datetime (DB configured for Asia/Phnom_Penh timezone)."""
    return datetime.now()


class WordDetectionProgressService:

    def __init__(self, db: Session) -> None:
        self.db = db
        self.progress = WordDetectionProgressRepository(db)

    def get_lesson_progress(
        self, user_id: uuid.UUID, lesson_id: int
    ) -> WordDetectionUserLessonProgress | None:
        return self.progress.get_lesson_progress(user_id, lesson_id)

    def update_last_practice_progress(
        self, progress: WordDetectionUserLessonProgress
    ) -> None:
        progress.last_practiced_at = _utc_now_naive()

    def record_practice_attempt(
        self,
        user_id: uuid.UUID,
        lesson_id: int,
        *,
        accuracy: float | None = None,
        passed: bool = False,
        predicted_confidence: float | None = None,
    ) -> WordDetectionUserLessonProgress | None:
        progress = self.progress.get_or_create_lesson_progress(user_id, lesson_id)
        self.update_last_practice_progress(progress)

        progress.attempts = (progress.attempts or 0) + 1

        # Always record predicted_confidence (running average across attempts)
        if predicted_confidence is not None:
            if progress.predicted_confidence is None:
                progress.predicted_confidence = predicted_confidence
            else:
                progress.predicted_confidence = (
                    progress.predicted_confidence + predicted_confidence
                ) / 2

        # Always mark lesson as complete when user clicks Continue/Next.
        # If label didn't match (max retry skip), predicted_confidence will be 0.
        progress.is_completed = True
        progress.is_locked = False
        if progress.completed_at is None:
            progress.completed_at = progress.last_practiced_at

        self.db.commit()
        self.db.refresh(progress)
        WordDetectionLockingService.clear_cache()
        return progress

    def complete_lesson(
        self,
        user_id: uuid.UUID,
        lesson_id: int,
        *,
        accuracy: float | None = None,
        predicted_confidence: float | None = None,
    ) -> WordDetectionUserLessonProgress | None:
        return self.record_practice_attempt(
            user_id,
            lesson_id,
            accuracy=accuracy,
            passed=True,
            predicted_confidence=predicted_confidence,
        )

    def is_lesson_locked_by_id(
        self,
        user_id: uuid.UUID | None,
        lesson_id: int,
        *,
        active_only: bool = True,
    ) -> bool:
        """Linear unlock: only the first curriculum lesson is free; each next needs the prior completed."""
        return WordDetectionLockingService(self.db).is_lesson_locked(lesson_id, user_id)

    def progress_status_for_lesson(
        self, user_id: uuid.UUID | None, lesson_id: int
    ) -> str:
        if user_id is None:
            return "NOT_STARTED"
        row = self.progress.get_lesson_progress(user_id, lesson_id)
        if row is None:
            return "NOT_STARTED"
        if row.is_completed:
            return "COMPLETED"
        if row.last_practiced_at is not None or (row.attempts or 0) > 0:
            return "IN_PROGRESS"
        return "NOT_STARTED"
