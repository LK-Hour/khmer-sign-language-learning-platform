"""Generic admin business logic for exercises and exercise options.

Shared by every learning track. ``exercise_type`` is validated against the
track's own enum, so Finger Spelling accepts ``image_select`` while Word Sign
would accept ``video_select`` - all from the same code path.
"""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from src.repositories.admin.base_crud_repository import BaseCrudRepository
from src.schemas.admin.exercise import (
    ExerciseCreate,
    ExerciseOptionCreate,
    ExerciseOptionResponse,
    ExerciseOptionUpdate,
    ExerciseResponse,
    ExerciseUpdate,
)
from src.services.admin.track_registry import TrackConfig, get_track_config


class ExerciseAdminService:
    def __init__(self, db: Session, track: str) -> None:
        self.db = db
        self.cfg: TrackConfig = get_track_config(track)
        self.lessons = BaseCrudRepository(db, self.cfg.lesson_model)
        self.exercises = BaseCrudRepository(db, self.cfg.exercise_model)
        self.options = BaseCrudRepository(db, self.cfg.option_model)

    # ── validation ───────────────────────────────────────────────────────

    def _validate_exercise_type(self, exercise_type: str) -> None:
        allowed = self.cfg.valid_exercise_types()
        if exercise_type not in allowed:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Invalid exercise_type '{exercise_type}' for track "
                    f"'{self.cfg.key}'. Allowed: {', '.join(allowed)}."
                ),
            )

    # ── read with eager-loaded relations ─────────────────────────────────

    def _load_exercise(self, exercise_id: int):
        model = self.cfg.exercise_model
        stmt = (
            select(model)
            .options(
                selectinload(model.options),
                joinedload(model.media),
            )
            .where(model.id == exercise_id)
        )
        return self.db.scalars(stmt).unique().first()

    def _exercise_response(self, exercise) -> ExerciseResponse:
        return ExerciseResponse.model_validate(exercise)

    def _option_response(self, option) -> ExerciseOptionResponse:
        return ExerciseOptionResponse.model_validate(option)

    # ── Exercises ────────────────────────────────────────────────────────

    def list_exercises(
        self, *, lesson_id: int | None = None, active_only: bool = False
    ) -> list[ExerciseResponse]:
        model = self.cfg.exercise_model
        stmt = (
            select(model)
            .options(selectinload(model.options), joinedload(model.media))
            .order_by(model.lesson_id, model.order_index)
        )
        if lesson_id is not None:
            stmt = stmt.where(model.lesson_id == lesson_id)
        if active_only:
            stmt = stmt.where(model.is_active.is_(True))
        rows = self.db.scalars(stmt).unique().all()
        return [self._exercise_response(e) for e in rows]

    def get_exercise(self, exercise_id: int) -> ExerciseResponse | None:
        exercise = self._load_exercise(exercise_id)
        return self._exercise_response(exercise) if exercise else None

    def create_exercise(self, body: ExerciseCreate) -> ExerciseResponse | None:
        if self.lessons.get(body.lesson_id) is None:
            return None
        self._validate_exercise_type(body.exercise_type)

        data = body.model_dump(exclude={"options"})
        exercise = self.exercises.create(**data)
        for opt in body.options:
            self.options.create(exercise_id=exercise.id, **opt.model_dump())
        self.db.commit()
        return self._exercise_response(self._load_exercise(exercise.id))

    def update_exercise(
        self, exercise_id: int, body: ExerciseUpdate
    ) -> ExerciseResponse | None:
        exercise = self.exercises.get(exercise_id)
        if exercise is None:
            return None
        updates = body.model_dump(exclude_unset=True)
        if "exercise_type" in updates:
            self._validate_exercise_type(updates["exercise_type"])
        if "lesson_id" in updates and self.lessons.get(updates["lesson_id"]) is None:
            return None
        self.exercises.update(exercise, updates)
        self.db.commit()
        return self._exercise_response(self._load_exercise(exercise_id))

    def soft_delete_exercise(self, exercise_id: int) -> ExerciseResponse | None:
        exercise = self.exercises.get(exercise_id)
        if exercise is None:
            return None
        self.exercises.soft_delete(exercise)
        self.db.commit()
        return self._exercise_response(self._load_exercise(exercise_id))

    # ── Exercise options ─────────────────────────────────────────────────

    def create_option(
        self, exercise_id: int, body: ExerciseOptionCreate
    ) -> ExerciseOptionResponse | None:
        if self.exercises.get(exercise_id) is None:
            return None
        option = self.options.create(exercise_id=exercise_id, **body.model_dump())
        self.db.commit()
        self.db.refresh(option)
        return self._option_response(option)

    def update_option(
        self, option_id: int, body: ExerciseOptionUpdate
    ) -> ExerciseOptionResponse | None:
        option = self.options.get(option_id)
        if option is None:
            return None
        self.options.update(option, body.model_dump(exclude_unset=True))
        self.db.commit()
        self.db.refresh(option)
        return self._option_response(option)

    def delete_option(self, option_id: int) -> bool:
        """Hard delete - options have no ``is_active`` flag."""
        option = self.options.get(option_id)
        if option is None:
            return False
        self.options.hard_delete(option)
        self.db.commit()
        return True
