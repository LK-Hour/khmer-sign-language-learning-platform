"""Data access for word detection user progress and exercise results."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models.word_detection import (
    WordDetectionExerciseProgress,
    WordDetectionUserLessonProgress,
)


class WordDetectionProgressRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_lesson_progress(
        self, user_id: uuid.UUID, lesson_id: int
    ) -> WordDetectionUserLessonProgress | None:
        stmt = select(WordDetectionUserLessonProgress).where(
            WordDetectionUserLessonProgress.user_id == user_id,
            WordDetectionUserLessonProgress.word_detection_lesson_id == lesson_id,
        )
        return self.db.scalars(stmt).first()

    def get_or_create_lesson_progress(
        self, user_id: uuid.UUID, lesson_id: int
    ) -> WordDetectionUserLessonProgress:
        progress = self.get_lesson_progress(user_id, lesson_id)
        if progress:
            return progress

        progress = WordDetectionUserLessonProgress(
            user_id=user_id,
            word_detection_lesson_id=lesson_id,
        )
        self.db.add(progress)
        self.db.flush()
        return progress

    def count_completed_lessons(self, user_id: uuid.UUID, lesson_ids: list[int]) -> int:
        if not lesson_ids:
            return 0
        stmt = (
            select(func.count())
            .select_from(WordDetectionUserLessonProgress)
            .where(
                WordDetectionUserLessonProgress.user_id == user_id,
                WordDetectionUserLessonProgress.word_detection_lesson_id.in_(lesson_ids),
                WordDetectionUserLessonProgress.is_completed.is_(True),
            )
        )
        return int(self.db.scalar(stmt) or 0)

    def next_exercise_attempt_number(self, user_id: uuid.UUID, exercise_id: int) -> int:
        stmt = (
            select(func.coalesce(func.max(WordDetectionExerciseProgress.attempts), 0))
            .where(
                WordDetectionExerciseProgress.user_id == user_id,
                WordDetectionExerciseProgress.word_detection_exercise_id == exercise_id,
            )
        )
        return int(self.db.scalar(stmt) or 0) + 1

    def add_exercise_result(
        self,
        *,
        user_id: uuid.UUID,
        exercise_id: int,
        is_correct: bool,
        attempts: int,
        selected_answer_id: int | None = None,
        selected_answer: str | None = None,
    ) -> WordDetectionExerciseProgress:
        result = WordDetectionExerciseProgress(
            user_id=user_id,
            word_detection_exercise_id=exercise_id,
            selected_answer_id=selected_answer_id,
            selected_answer=selected_answer,
            is_correct=is_correct,
            attempts=attempts,
        )
        self.db.add(result)
        self.db.flush()
        return result
