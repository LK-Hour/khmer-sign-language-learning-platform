"""Business logic for word detection exercises."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.models.word_detection import WordDetectionExercise, WordDetectionExerciseType
from src.repositories.word_detection.word_detection_curriculum_repository import (
    WordDetectionCurriculumRepository,
)
from src.repositories.word_detection.word_detection_exercise_repository import (
    WordDetectionExerciseRepository,
)
from src.repositories.word_detection.word_detection_progress_repository import (
    WordDetectionProgressRepository,
)
from src.services.word_detection.word_detection_curriculum_service import (
    WordDetectionCurriculumService,
)


@dataclass
class WdExerciseSubmitResult:
    is_correct: bool
    attempt_number: int
    lesson_id: int
    progress_id: uuid.UUID
    explanation_en: str | None = None
    explanation_kh: str | None = None


class WordDetectionExerciseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.exercises = WordDetectionExerciseRepository(db)
        self.curriculum = WordDetectionCurriculumRepository(db)
        self.progress = WordDetectionProgressRepository(db)
        self.curriculum_service = WordDetectionCurriculumService(db)

    def is_chapter_exercise_unlocked(
        self, user_id: uuid.UUID | None, chapter_id: int
    ) -> bool:
        return self.curriculum_service.is_chapter_exercise_unlocked(user_id, chapter_id)

    def _chapter_id_for_exercise(self, exercise: WordDetectionExercise) -> int | None:
        lesson = self.curriculum.get_lesson_by_id(exercise.lesson_id, active_only=False)
        return lesson.chapter_id if lesson else None

    def list_chapter_exercises(
        self, chapter_id: int, *, active_only: bool = True
    ) -> list[WordDetectionExercise] | None:
        """Get all exercises for all lessons in a chapter."""
        chapter = self.curriculum.get_chapter_by_id(chapter_id, active_only=active_only)
        if chapter is None:
            return None

        lessons = self.curriculum.list_lessons_by_chapter(chapter_id, active_only=active_only)
        if not lessons:
            return []

        all_exercises: list[WordDetectionExercise] = []
        for lesson in lessons:
            exercises = self.exercises.list_with_options_by_lesson(
                lesson.id, active_only=active_only
            )
            all_exercises.extend(exercises)

        return all_exercises

    def get_exercise(
        self, exercise_id: int, *, active_only: bool = True
    ) -> WordDetectionExercise | None:
        return self.exercises.get_with_options(exercise_id, active_only=active_only)

    def submit_answer(
        self,
        *,
        user_id: uuid.UUID,
        exercise_id: int,
        selected_option_id: int | None = None,
        selected_answer: str | None = None,
        time_taken: int = 0,
    ) -> WdExerciseSubmitResult | None:
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

        lesson_progress = self.progress.get_or_create_lesson_progress(
            user_id, exercise.lesson_id
        )
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

        return WdExerciseSubmitResult(
            is_correct=is_correct,
            attempt_number=attempt_number,
            lesson_id=exercise.lesson_id,
            progress_id=lesson_progress.id,
            explanation_en=exercise.explanation_en,
            explanation_kh=exercise.explanation_kh,
        )

    def _grade_exercise(
        self,
        exercise: WordDetectionExercise,
        *,
        selected_option_id: int | None,
        selected_answer: str | None,
    ) -> bool:
        exercise_type = exercise.exercise_type
        if isinstance(exercise_type, WordDetectionExerciseType):
            exercise_type = exercise_type.value

        if exercise_type in (
            WordDetectionExerciseType.MULTIPLE_CHOICE.value,
            WordDetectionExerciseType.IMAGE_SELECT.value,
            WordDetectionExerciseType.MATCHING.value,
        ):
            if selected_option_id is None:
                return False
            option = self.exercises.get_option_by_id(selected_option_id)
            if option is None or option.exercise_id != exercise.id:
                return False
            return bool(option.is_correct)

        if exercise_type == WordDetectionExerciseType.FREE_FORM.value:
            if not selected_answer or not exercise.correct_answer:
                return False
            return selected_answer.strip().casefold() == exercise.correct_answer.strip().casefold()

        return False
