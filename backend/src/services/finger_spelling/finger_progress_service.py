"""Business logic for finger spelling lesson progress."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from src.models.finger_spelling import FingerUserLessonProgress
from src.repositories.finger_spelling.finger_progress_repository import FingerProgressRepository
from src.services.finger_spelling.finger_locking_service import FingerLockingService


def _utc_now_naive() -> datetime:
    """Return current datetime (DB configured for Asia/Phnom_Penh timezone)."""
    return datetime.now()


class FingerProgressService:
    PRACTICE_PASS_ACCURACY = 50

    def __init__(self, db: Session) -> None:
        self.db = db
        self.progress = FingerProgressRepository(db)

    def get_lesson_progress(
        self, user_id: uuid.UUID, lesson_id: int
    ) -> FingerUserLessonProgress | None:
        return self.progress.get_lesson_progress(user_id, lesson_id)

    def update_last_practice_progress(self, progress: FingerUserLessonProgress) -> None:
        progress.last_practiced_at = _utc_now_naive()

    def record_practice_attempt(
        self,
        user_id: uuid.UUID,
        lesson_id: int,
        *,
        accuracy: float | None = None,
        passed: bool = False,
    ) -> FingerUserLessonProgress | None:
        progress = self.progress.get_or_create_lesson_progress(user_id, lesson_id)
        self.update_last_practice_progress(progress)

        progress.attempts = (progress.attempts or 0) + 1

        if passed:
            progress.is_completed = True
            if progress.completed_at is None:
                progress.completed_at = progress.last_practiced_at

        self.db.commit()
        self.db.refresh(progress)
        if passed:
            FingerLockingService.clear_cache()
        return progress

    def complete_lesson(
        self,
        user_id: uuid.UUID,
        lesson_id: int,
        *,
        accuracy: float | None = None,
    ) -> FingerUserLessonProgress | None:
        return self.record_practice_attempt(
            user_id,
            lesson_id,
            accuracy=accuracy,
            passed=True,
        )

    def is_lesson_locked_by_id(
        self,
        user_id: uuid.UUID | None,
        lesson_id: int,
        *,
        active_only: bool = True,
    ) -> bool:
        """Linear unlock: only the first curriculum lesson is free; each next needs the prior completed."""
        return FingerLockingService(self.db).is_lesson_locked(lesson_id, user_id)

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
