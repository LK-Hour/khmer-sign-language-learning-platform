"""Data access for finger spelling user lesson progress."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models.finger_spelling import FingerUserLessonProgress


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

    def get_or_create_lesson_progress(
        self, user_id: uuid.UUID, lesson_id: int
    ) -> FingerUserLessonProgress:
        progress = self.get_lesson_progress(user_id, lesson_id)
        if progress:
            return progress

        progress = FingerUserLessonProgress(
            user_id=user_id,
            finger_lesson_id=lesson_id,
        )
        self.db.add(progress)
        self.db.flush()
        return progress

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
