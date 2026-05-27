"""Business logic for finger spelling exercises."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy.orm import Session

from src.models.finger_spelling import FingerExercise, FingerExerciseType
from src.repositories.finger_curriculum_repository import FingerCurriculumRepository
from src.repositories.finger_exercise_repository import FingerExerciseRepository
from src.repositories.finger_progress_repository import FingerProgressRepository
from src.services.finger_spelling.finger_progress_service import FingerProgressService


@dataclass
class ExerciseSubmitResult:
    is_correct: bool
    attempt_number: int
    progress_id: uuid.UUID
    explanation_en: str | None = None
    explanation_kh: str | None = None


class FingerExerciseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.exercises = FingerExerciseRepository(db)
        self.curriculum = FingerCurriculumRepository(db)
        self.progress_repo = FingerProgressRepository(db)
        self.progress_service = FingerProgressService(db)

    def list_lesson_exercises(
        self, lesson_id: int, *, active_only: bool = True
    ) -> list[FingerExercise] | None:
        if self.curriculum.get_lesson_by_id(lesson_id, active_only=active_only) is None:
            return None
        return self.exercises.list_with_options_by_lesson(lesson_id, active_only=active_only)

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

        progress = self.progress_repo.get_or_create_lesson_progress(user_id, exercise.lesson_id)
        attempt_number = self.progress_repo.next_exercise_attempt_number(
            user_id, exercise_id, progress.id
        )
        is_correct = self._grade_exercise(
            exercise,
            selected_option_id=selected_option_id,
            selected_answer=selected_answer,
        )

        self.progress_repo.add_exercise_result(
            user_id=user_id,
            exercise_id=exercise_id,
            progress_id=progress.id,
            is_correct=is_correct,
            time_taken=time_taken,
            attempt_number=attempt_number,
            selected_option_id=selected_option_id,
            selected_answer=selected_answer,
        )

        progress.attempts = (progress.attempts or 0) + 1
        progress.total_time_spent = (progress.total_time_spent or 0) + max(time_taken, 0)
        self.progress_service.touch_progress(progress)
        self.progress_service.maybe_complete_lesson(user_id, exercise.lesson_id, progress)

        self.db.commit()
        self.db.refresh(progress)

        return ExerciseSubmitResult(
            is_correct=is_correct,
            attempt_number=attempt_number,
            progress_id=progress.id,
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

        if exercise_type in (FingerExerciseType.MULTIPLE_CHOICE.value, FingerExerciseType.IMAGE_SELECT.value, FingerExerciseType.MATCHING.value):
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
