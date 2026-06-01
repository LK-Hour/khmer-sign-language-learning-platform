"""Data access for finger spelling user progress and exercise results."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models.finger_spelling import FingerUserExerciseResult, FingerUserLessonProgress


def _utc_now_naive() -> datetime:
    """Return current datetime (DB configured for Asia/Phnom_Penh timezone)."""
    return datetime.now()


class FingerProgressRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_lesson_progress(
        self, user_id: uuid.UUID, lesson_id: int
    ) -> FingerUserLessonProgress | None:
        stmt = select(FingerUserLessonProgress).where(
            FingerUserLessonProgress.user_id == user_id,
            FingerUserLessonProgress.finger_lesson_id == lesson_id,
        )
        return self.db.scalars(stmt).first()

    def list_lesson_progress_for_user(
        self, user_id: uuid.UUID, lesson_ids: list[int] | None = None
    ) -> list[FingerUserLessonProgress]:
        stmt = select(FingerUserLessonProgress).where(FingerUserLessonProgress.user_id == user_id)
        if lesson_ids is not None:
            stmt = stmt.where(FingerUserLessonProgress.finger_lesson_id.in_(lesson_ids))
        return list(self.db.scalars(stmt).all())

    def get_or_create_lesson_progress(
        self, user_id: uuid.UUID, lesson_id: int
    ) -> FingerUserLessonProgress:
        progress = self.get_lesson_progress(user_id, lesson_id)
        if progress:
            return progress

        now = _utc_now_naive()
        progress = FingerUserLessonProgress(
            user_id=user_id,
            finger_lesson_id=lesson_id,
            started_at=now,
            last_accessed_at=now,
        )
        self.db.add(progress)
        self.db.flush()
        return progress

    def list_completed_lesson_ids(
        self, user_id: uuid.UUID, lesson_ids: list[int]
    ) -> set[int]:
        if not lesson_ids:
            return set()
        stmt = select(FingerUserLessonProgress.finger_lesson_id).where(
            FingerUserLessonProgress.user_id == user_id,
            FingerUserLessonProgress.finger_lesson_id.in_(lesson_ids),
            FingerUserLessonProgress.is_completed.is_(True),
        )
        return set(self.db.scalars(stmt).all())

    def get_progress_map(
        self, user_id: uuid.UUID, lesson_ids: list[int]
    ) -> dict[int, FingerUserLessonProgress]:
        if not lesson_ids:
            return {}
        rows = self.list_lesson_progress_for_user(user_id, lesson_ids)
        return {row.finger_lesson_id: row for row in rows}

    def count_completed_lessons(self, user_id: uuid.UUID, lesson_ids: list[int]) -> int:
        if not lesson_ids:
            return 0
        stmt = (
            select(func.count())
            .select_from(FingerUserLessonProgress)
            .where(
                FingerUserLessonProgress.user_id == user_id,
                FingerUserLessonProgress.finger_lesson_id.in_(lesson_ids),
                FingerUserLessonProgress.is_completed.is_(True),
            )
        )
        return int(self.db.scalar(stmt) or 0)

    def count_completed_lessons_in_chapter(self, user_id: uuid.UUID, chapter_id: int) -> int:
        from src.models.finger_spelling import FingerLesson

        stmt = (
            select(func.count())
            .select_from(FingerUserLessonProgress)
            .join(FingerLesson, FingerUserLessonProgress.finger_lesson_id == FingerLesson.id)
            .where(
                FingerUserLessonProgress.user_id == user_id,
                FingerLesson.chapter_id == chapter_id,
                FingerUserLessonProgress.is_completed.is_(True),
            )
        )
        return int(self.db.scalar(stmt) or 0)

    def next_exercise_attempt_number(self, user_id: uuid.UUID, exercise_id: int) -> int:
        stmt = (
            select(func.coalesce(func.max(FingerUserExerciseResult.attempt_number), 0))
            .where(
                FingerUserExerciseResult.user_id == user_id,
                FingerUserExerciseResult.finger_exercise_id == exercise_id,
            )
        )
        return int(self.db.scalar(stmt) or 0) + 1

    def add_exercise_result(
        self,
        *,
        user_id: uuid.UUID,
        progress_id: uuid.UUID,
        exercise_id: int,
        is_correct: bool,
        time_taken: int,
        attempt_number: int,
        selected_option_id: int | None = None,
        selected_answer: str | None = None,
    ) -> FingerUserExerciseResult:
        result = FingerUserExerciseResult(
            user_id=user_id,
            progress_id=progress_id,
            finger_exercise_id=exercise_id,
            selected_option_id=selected_option_id,
            selected_answer=selected_answer,
            is_correct=is_correct,
            time_taken=time_taken,
            attempt_number=attempt_number,
        )
        self.db.add(result)
        self.db.flush()
        return result
