"""Track-aware admin service for exercise and option management."""

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

    def _get_exercise(self, exercise_id: int):
        stmt = (
            select(self.config.exercise_model)
            .options(selectinload(self.config.exercise_model.options))
            .where(self.config.exercise_model.id == exercise_id)
        )
        return self.db.scalars(stmt).unique().first()

    def _get_option(self, option_id: int):
        return self.db.get(self.config.option_model, option_id)

    def list_exercises(
        self,
        *,
        lesson_id: int | None = None,
        chapter_id: int | None = None,
        active_only: bool = False,
    ):
        stmt = select(self.config.exercise_model).options(
            selectinload(self.config.exercise_model.options)
        )
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
        return list(self.db.scalars(stmt).unique().all())

    def create_exercise(self, body: ExerciseCreate):
        if self._get_lesson(body.lesson_id) is None:
            return None

        exercise_data = body.model_dump(exclude={"options"})
        exercise_data["exercise_type"] = self._validate_exercise_type(
            body.exercise_type
        )
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

    def delete_option(self, option_id: int) -> bool:
        option = self._get_option(option_id)
        if option is None:
            return False
        self.db.delete(option)
        self.db.commit()
        return True
