"""Read helpers for finger spelling exercises (unit quiz is the submit path)."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from src.models.finger_spelling import FingerExercise
from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.repositories.finger_spelling.finger_exercise_repository import FingerExerciseRepository
from src.services.finger_spelling.finger_curriculum_service import FingerCurriculumService


class FingerExerciseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.exercises = FingerExerciseRepository(db)
        self.curriculum = FingerCurriculumRepository(db)
        self.curriculum_service = FingerCurriculumService(db)

    def is_chapter_exercise_unlocked(
        self, user_id: uuid.UUID | None, chapter_id: int
    ) -> bool:
        return self.curriculum_service.is_chapter_exercise_unlocked(user_id, chapter_id)

    def list_chapter_exercises(
        self, chapter_id: int, *, active_only: bool = True
    ) -> list[FingerExercise] | None:
        """Get all exercises for all lessons in a chapter."""
        chapter = self.curriculum.get_chapter_by_id(chapter_id, active_only=active_only)
        if chapter is None:
            return None

        lessons = self.curriculum.list_lessons_by_chapter(chapter_id, active_only=active_only)
        if not lessons:
            return []

        all_exercises: list[FingerExercise] = []
        for lesson in lessons:
            exercises = self.exercises.list_with_options_by_lesson(lesson.id, active_only=active_only)
            all_exercises.extend(exercises)

        return all_exercises

    def get_exercise(
        self, exercise_id: int, *, active_only: bool = True
    ) -> FingerExercise | None:
        return self.exercises.get_with_options(exercise_id, active_only=active_only)
