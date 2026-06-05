"""Business logic for finger spelling exercises (ERD: lesson-scoped storage)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.models.finger_spelling import FingerExercise, FingerExerciseType
from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.repositories.finger_spelling.finger_exercise_repository import FingerExerciseRepository
from src.repositories.finger_spelling.finger_progress_repository import FingerProgressRepository
from src.services.finger_spelling.finger_curriculum_service import FingerCurriculumService


@dataclass
class ExerciseSubmitResult:
    is_correct: bool
    attempt_number: int
    lesson_id: int
    progress_id: uuid.UUID
    explanation_en: str | None = None
    explanation_kh: str | None = None


class FingerExerciseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.exercises = FingerExerciseRepository(db)
        self.curriculum = FingerCurriculumRepository(db)
        self.progress = FingerProgressRepository(db)
        self.curriculum_service = FingerCurriculumService(db)

    def is_chapter_exercise_unlocked(
        self, user_id: uuid.UUID | None, chapter_id: int
    ) -> bool:
        return self.curriculum_service.is_chapter_exercise_unlocked(user_id, chapter_id)

    def _chapter_id_for_exercise(self, exercise: FingerExercise) -> int | None:
        lesson = self.curriculum.get_lesson_by_id(exercise.lesson_id, active_only=False)
        return lesson.chapter_id if lesson else None

    def list_chapter_exercises(
        self, chapter_id: int, user_id: uuid.UUID | None, *, active_only: bool = True
    ) -> list[FingerExercise] | None:
        if self.curriculum.get_chapter_by_id(chapter_id, active_only=active_only) is None:
            return None
        if not self.is_chapter_exercise_unlocked(user_id, chapter_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chapter exercises are locked until all lessons in the chapter are completed",
            )
        return self.exercises.list_with_options_by_chapter(chapter_id, active_only=active_only)

    def list_chapter_exercises(
        self, chapter_id: int, *, active_only: bool = True
    ) -> list[FingerExercise] | None:
        """Get all exercises for all lessons in a chapter, grouped by lesson."""
        # Verify chapter exists
        chapter = self.curriculum.get_chapter_by_id(chapter_id, active_only=active_only)
        if chapter is None:
            return None

        # Get all lessons in chapter
        lessons = self.curriculum.list_lessons_by_chapter(chapter_id, active_only=active_only)
        if not lessons:
            return []

        # Aggregate exercises from all lessons
        all_exercises: list[FingerExercise] = []
        for lesson in lessons:
            exercises = self.exercises.list_with_options_by_lesson(lesson.id, active_only=active_only)
            all_exercises.extend(exercises)

        return all_exercises

    def get_exercise(
        self, exercise_id: int, *, active_only: bool = True
    ) -> FingerExercise | None:
        return self.exercises.get_with_options(exercise_id, active_only=active_only)

    def submit_answer(
        self,
        *,
        user_id: uuid.UUID,
        exercise_id: int,
        selected_option_id: int | None = None,
        selected_answer: str | None = None,
        time_taken: int = 0,
    ) -> ExerciseSubmitResult | None:
        exercise = self.exercises.get_with_options(exercise_id, active_only=True)
        if exercise is None:
            return None

        chapter_id = self._chapter_id_for_exercise(exercise)
        if chapter_id is None:
            return None
        if not self.is_chapter_exercise_unlocked(user_id, chapter_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chapter exercises are locked until all lessons in the chapter are completed",
            )

        lesson_progress = self.progress.get_or_create_lesson_progress(user_id, exercise.lesson_id)
        attempt_number = self.progress.next_exercise_attempt_number(user_id, exercise_id)
        is_correct = self._grade_exercise(
            exercise,
            selected_option_id=selected_option_id,
            selected_answer=selected_answer,
        )

        self.progress.add_exercise_result(
            user_id=user_id,
            progress_id=lesson_progress.id,
            exercise_id=exercise_id,
            is_correct=is_correct,
            time_taken=time_taken,
            attempt_number=attempt_number,
            selected_option_id=selected_option_id,
            selected_answer=selected_answer,
        )

        self.db.commit()

        return ExerciseSubmitResult(
            is_correct=is_correct,
            attempt_number=attempt_number,
            lesson_id=exercise.lesson_id,
            progress_id=lesson_progress.id,
            explanation_en=exercise.explanation_en,
            explanation_kh=exercise.explanation_kh,
        )

    def _grade_exercise(
        self,
        exercise: FingerExercise,
        *,
        selected_option_id: int | None,
        selected_answer: str | None,
    ) -> bool:
        exercise_type = exercise.exercise_type
        if isinstance(exercise_type, FingerExerciseType):
            exercise_type = exercise_type.value

        if exercise_type in (
            FingerExerciseType.MULTIPLE_CHOICE.value,
            FingerExerciseType.IMAGE_SELECT.value,
            FingerExerciseType.MATCHING.value,
        ):
            if selected_option_id is None:
                return False
            option = self.exercises.get_option_by_id(selected_option_id)
            if option is None or option.exercise_id != exercise.id:
                return False
            return bool(option.is_correct)

        if exercise_type == FingerExerciseType.FREE_FORM.value:
            if not selected_answer or not exercise.correct_answer:
                return False
            return selected_answer.strip().casefold() == exercise.correct_answer.strip().casefold()

        return False
