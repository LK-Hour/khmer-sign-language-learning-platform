"""Business logic for finger spelling lesson progress."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from src.models.finger_spelling import FingerUserLessonProgress
from src.repositories.finger_spelling.finger_exercise_repository import FingerExerciseRepository
from src.repositories.finger_spelling.finger_progress_repository import FingerProgressRepository


def _utc_now_naive() -> datetime:
    """Return current datetime (DB configured for Asia/Phnom_Penh timezone)."""
    return datetime.now()


class FingerProgressService:
    PRACTICE_PASS_ACCURACY = 80.0

    def __init__(self, db: Session) -> None:
        self.db = db
        self.progress = FingerProgressRepository(db)
        self.exercises = FingerExerciseRepository(db)

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
        return progress

    def maybe_complete_lesson(
        self,
        user_id: uuid.UUID,
        lesson_id: int,
        progress: FingerUserLessonProgress,
    ) -> bool:
        """Mark lesson complete when every active exercise has a correct attempt."""
        if progress.is_completed:
            return True

        total_exercises = self.exercises.count_by_lesson(lesson_id, active_only=True)
        if total_exercises == 0:
            return False

        correct_count = self.progress.count_correct_results_for_progress(progress.id)
        if correct_count < total_exercises:
            return False

        progress.is_completed = True
        progress.completed_at = _utc_now_naive()
        return True

    def is_lesson_locked(
        self,
        user_id: uuid.UUID | None,
        order_index: int,
        chapter_id: int,
        *,
        active_only: bool = True,
    ) -> bool:
        """First lesson in a chapter is unlocked; others require prior lesson completion."""
        if user_id is None:
            return order_index > 1

        if order_index <= 1:
            return False

        from src.repositories.finger_spelling.finger_curriculum_repository import (
            FingerCurriculumRepository,
        )

        curriculum = FingerCurriculumRepository(self.db)
        lessons = curriculum.list_lessons_by_chapter(chapter_id, active_only=active_only)
        prior = next((lesson for lesson in lessons if lesson.order_index == order_index - 1), None)
        if prior is None:
            return False

        prior_progress = self.progress.get_lesson_progress(user_id, prior.id)
        return prior_progress is None or not prior_progress.is_completed

    def is_lesson_locked_by_id(
        self,
        user_id: uuid.UUID | None,
        lesson_id: int,
        *,
        active_only: bool = True,
    ) -> bool:
        from src.repositories.finger_spelling.finger_curriculum_repository import (
            FingerCurriculumRepository,
        )

        lesson = FingerCurriculumRepository(self.db).get_lesson_by_id(
            lesson_id, active_only=active_only
        )
        if lesson is None:
            return True
        return self.is_lesson_locked(
            user_id,
            lesson.order_index,
            lesson.chapter_id,
            active_only=active_only,
        )

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
