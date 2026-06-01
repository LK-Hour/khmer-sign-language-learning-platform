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
    PRACTICE_PASS_ACCURACY = 80.0

    def __init__(self, db: Session) -> None:
        self.db = db
        self.progress = FingerProgressRepository(db)

    def get_lesson_progress(
        self, user_id: uuid.UUID, lesson_id: int
    ) -> FingerUserLessonProgress | None:
        return self.progress.get_lesson_progress(user_id, lesson_id)

    def touch_progress(self, progress: FingerUserLessonProgress) -> None:
        progress.last_accessed_at = _utc_now_naive()
        if progress.started_at is None:
            progress.started_at = progress.last_accessed_at

    def complete_lesson(
        self,
        user_id: uuid.UUID,
        lesson_id: int,
        *,
        peak_accuracy: float | None = None,
        time_spent: int = 0,
    ) -> FingerUserLessonProgress | None:
        progress = self.progress.get_or_create_lesson_progress(user_id, lesson_id)
        self.touch_progress(progress)

        progress.is_completed = True
        progress.completed_at = _utc_now_naive()
        progress.attempts = (progress.attempts or 0) + 1
        progress.total_time_spent = (progress.total_time_spent or 0) + max(time_spent, 0)

        if peak_accuracy is not None:
            current_peak = float(progress.peak_accuracy) if progress.peak_accuracy is not None else 0.0
            progress.peak_accuracy = max(current_peak, peak_accuracy)

        self.db.commit()
        self.db.refresh(progress)
        FingerLockingService.clear_cache()
        return progress

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
        if row.started_at is not None or (row.attempts or 0) > 0:
            return "IN_PROGRESS"
        return "NOT_STARTED"
