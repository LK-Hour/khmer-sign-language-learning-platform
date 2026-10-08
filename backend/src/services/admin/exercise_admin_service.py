"""Track-aware admin service for exercise and option management.

Unlike units/chapters/lessons, exercises don't go through a confirm-publish
step: an exercise is learner-visible as soon as it's ``is_active`` and its
parent lesson is published (see ``FingerExerciseRepository.list_exercises_for_unit``
and its word-detection equivalent, which never look at a per-exercise publish
state). Soft delete via ``is_active`` is the only lifecycle toggle here.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from src.schemas.admin.exercise import (
    ExerciseCreate,
    ExerciseOptionCreate,
    ExerciseOptionUpdate,
    ExerciseUpdate,
)
from src.services.registry.track_registry import TrackConfig, get_track_config


class ExerciseAdminService:
    def __init__(self, db: Session, track: str) -> None:
        self.db = db
        self.config: TrackConfig = get_track_config(track)

    def _validate_exercise_type(self, exercise_type: str) -> str:
        valid_types = self.config.valid_exercise_types()
        if exercise_type not in valid_types:
            raise ValueError(
                f"Invalid exercise type '{exercise_type}'. Valid types: {', '.join(valid_types)}"
            )
        return exercise_type

    def _get_lesson(self, lesson_id: int):
        return self.db.get(self.config.lesson_model, lesson_id)

    def _unit_id_for_lesson(self, lesson_id: int) -> int | None:
        """`finger_exercises.unit_id` / `word_detection_exercises.unit_id` are NOT NULL
        (added for direct unit-scoped queries, e.g. quiz question pools), but the admin
        only picks a lesson, so this derives it via lesson -> chapter -> unit."""
        lesson = self._get_lesson(lesson_id)
        if lesson is None:
            return None
        chapter = self.db.get(self.config.chapter_model, lesson.chapter_id)
        return chapter.unit_id if chapter is not None else None

    def _get_exercise(self, exercise_id: int):
        stmt = (
            select(self.config.exercise_model)
            .options(selectinload(self.config.exercise_model.options))
            .where(self.config.exercise_model.id == exercise_id)
        )
        exercise = self.db.scalars(stmt).unique().first()
        if exercise is not None:
            exercise.options = [option for option in exercise.options if option.is_active]
        return exercise

    def _get_option(self, option_id: int):
        stmt = select(self.config.option_model).where(
            self.config.option_model.id == option_id,
            self.config.option_model.is_active.is_(True),
        )
        return self.db.scalars(stmt).first()

    def list_exercises(
        self,
        *,
        lesson_id: int | None = None,
        chapter_id: int | None = None,
        unit_id: int | None = None,
        active_only: bool = False,
    ):
        stmt = select(self.config.exercise_model).options(
            selectinload(self.config.exercise_model.options)
        )
        if unit_id is not None:
            stmt = stmt.where(self.config.exercise_model.unit_id == unit_id)
        if chapter_id is not None:
            stmt = stmt.join(
                self.config.lesson_model,
                self.config.exercise_model.lesson_id == self.config.lesson_model.id,
            ).where(self.config.lesson_model.chapter_id == chapter_id)
        if lesson_id is not None:
            stmt = stmt.where(self.config.exercise_model.lesson_id == lesson_id)
        if active_only:
            stmt = stmt.where(self.config.exercise_model.is_active.is_(True))
        stmt = stmt.order_by(
            self.config.exercise_model.lesson_id,
            self.config.exercise_model.order_index,
        )
        exercises = list(self.db.scalars(stmt).unique().all())
        for exercise in exercises:
            exercise.options = [option for option in exercise.options if option.is_active]
        return exercises

    def create_exercise(self, body: ExerciseCreate):
        unit_id = self._unit_id_for_lesson(body.lesson_id)
        if unit_id is None:
            return None

        exercise_data = body.model_dump(exclude={"options"})
        exercise_data["exercise_type"] = self._validate_exercise_type(
            body.exercise_type
        )
        exercise_data["unit_id"] = unit_id
        exercise = self.config.exercise_model(**exercise_data)
        self.db.add(exercise)
        self.db.flush()

        for option_body in body.options:
            self.db.add(
                self.config.option_model(
                    exercise_id=exercise.id,
                    **option_body.model_dump(),
                )
            )

        self.db.commit()
        return self._get_exercise(exercise.id)

    def get_exercise(self, exercise_id: int):
        return self._get_exercise(exercise_id)

    def update_exercise(self, exercise_id: int, body: ExerciseUpdate):
        exercise = self._get_exercise(exercise_id)
        if exercise is None:
            return None

        update_data = body.model_dump(exclude_unset=True)
        lesson_id = update_data.get("lesson_id")
        if lesson_id is not None:
            # Moving the exercise to a lesson in a different chapter/unit must keep
            # unit_id in sync-it's what the learner-facing quiz pool queries filter on.
            unit_id = self._unit_id_for_lesson(lesson_id)
            if unit_id is None:
                return None
            update_data["unit_id"] = unit_id
        if "exercise_type" in update_data:
            update_data["exercise_type"] = self._validate_exercise_type(
                update_data["exercise_type"]
            )

        for field, value in update_data.items():
            setattr(exercise, field, value)

        self.db.commit()
        return self._get_exercise(exercise_id)

    def soft_delete_exercise(self, exercise_id: int):
        exercise = self._get_exercise(exercise_id)
        if exercise is None:
            return None
        exercise.is_active = False
        self.db.commit()
        return self._get_exercise(exercise_id)

    def restore_exercise(self, exercise_id: int):
        exercise = self._get_exercise(exercise_id)
        if exercise is None:
            return None
        exercise.is_active = True
        self.db.commit()
        return self._get_exercise(exercise_id)

    def create_option(self, exercise_id: int, body: ExerciseOptionCreate):
        if self._get_exercise(exercise_id) is None:
            return None
        option = self.config.option_model(
            exercise_id=exercise_id,
            **body.model_dump(),
        )
        self.db.add(option)
        self.db.commit()
        self.db.refresh(option)
        return option

    def update_option(self, option_id: int, body: ExerciseOptionUpdate):
        option = self._get_option(option_id)
        if option is None:
            return None
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(option, field, value)
        self.db.commit()
        self.db.refresh(option)
        return option

    def soft_delete_option(self, option_id: int) -> bool:
        option = self._get_option(option_id)
        if option is None:
            return False
        option.is_active = False
        self.db.commit()
        return True

    def restore_option(self, option_id: int) -> bool:
        stmt = select(self.config.option_model).where(
            self.config.option_model.id == option_id
        )
        option = self.db.scalars(stmt).first()
        if option is None:
            return False
        option.is_active = True
        self.db.commit()
        return True
