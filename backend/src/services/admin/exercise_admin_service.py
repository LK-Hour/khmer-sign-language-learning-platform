"""Track-aware admin service for exercise and option management.

Exercises follow the confirm-publish workflow: create/update produce ``draft``
rows hidden from learners; an explicit publish action makes them live. Options
have no publish state of their own — they go live together with their parent
exercise's publish action.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from src.models.publishable import PUBLISH_STATUS_DRAFT, PUBLISH_STATUS_PUBLISHED
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
        status: str | None = None,
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
        if status:
            stmt = stmt.where(self.config.exercise_model.publish_status == status)
        stmt = stmt.order_by(
            self.config.exercise_model.lesson_id,
            self.config.exercise_model.order_index,
        )
        exercises = list(self.db.scalars(stmt).unique().all())
        for exercise in exercises:
            exercise.options = [option for option in exercise.options if option.is_active]
        return exercises

    def create_exercise(self, body: ExerciseCreate):
        if self._get_lesson(body.lesson_id) is None:
            return None

        exercise_data = body.model_dump(exclude={"options"})
        exercise_data["exercise_type"] = self._validate_exercise_type(
            body.exercise_type
        )
        exercise_data["publish_status"] = PUBLISH_STATUS_DRAFT
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
        if lesson_id is not None and self._get_lesson(lesson_id) is None:
            return None
        if "exercise_type" in update_data:
            update_data["exercise_type"] = self._validate_exercise_type(
                update_data["exercise_type"]
            )
        update_data["publish_status"] = PUBLISH_STATUS_DRAFT

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

    def publish_exercise(self, exercise_id: int, actor_id: uuid.UUID | None):
        exercise = self._get_exercise(exercise_id)
        if exercise is None:
            return None
        if not exercise.is_active:
            raise ValueError("Cannot publish an inactive exercise. Restore it first.")
        lesson = self._get_lesson(exercise.lesson_id)
        if (
            lesson is None
            or not lesson.is_active
            or lesson.publish_status != PUBLISH_STATUS_PUBLISHED
        ):
            raise ValueError(
                "Cannot publish this exercise: its parent lesson is not published and active."
            )
        exercise.publish_status = PUBLISH_STATUS_PUBLISHED
        exercise.published_at = datetime.now()
        exercise.published_by = actor_id
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
