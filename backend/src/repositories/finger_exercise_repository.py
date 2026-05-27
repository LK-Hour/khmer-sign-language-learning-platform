"""Data access for finger spelling exercises and options."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from src.models.finger_spelling import FingerExercise, FingerExerciseOption


class FingerExerciseRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_by_lesson(self, lesson_id: int, *, active_only: bool = True) -> list[FingerExercise]:
        stmt = (
            select(FingerExercise)
            .where(FingerExercise.lesson_id == lesson_id)
            .order_by(FingerExercise.order_index)
        )
        if active_only:
            stmt = stmt.where(FingerExercise.is_active.is_(True))
        return list(self.db.scalars(stmt).all())

    def list_with_options_by_lesson(
        self, lesson_id: int, *, active_only: bool = True
    ) -> list[FingerExercise]:
        stmt = (
            select(FingerExercise)
            .options(
                selectinload(FingerExercise.options),
                joinedload(FingerExercise.media),
            )
            .where(FingerExercise.lesson_id == lesson_id)
            .order_by(FingerExercise.order_index)
        )
        if active_only:
            stmt = stmt.where(FingerExercise.is_active.is_(True))
        return list(self.db.scalars(stmt).unique().all())

    def get_by_id(self, exercise_id: int, *, active_only: bool = True) -> FingerExercise | None:
        stmt = select(FingerExercise).where(FingerExercise.id == exercise_id)
        if active_only:
            stmt = stmt.where(FingerExercise.is_active.is_(True))
        return self.db.scalars(stmt).first()

    def get_with_options(
        self, exercise_id: int, *, active_only: bool = True
    ) -> FingerExercise | None:
        stmt = (
            select(FingerExercise)
            .options(
                selectinload(FingerExercise.options).joinedload(FingerExerciseOption.media),
                joinedload(FingerExercise.media),
            )
            .where(FingerExercise.id == exercise_id)
        )
        if active_only:
            stmt = stmt.where(FingerExercise.is_active.is_(True))
        return self.db.scalars(stmt).unique().first()

    def get_option_by_id(self, option_id: int) -> FingerExerciseOption | None:
        return self.db.get(FingerExerciseOption, option_id)

    def count_by_lesson(self, lesson_id: int, *, active_only: bool = True) -> int:
        stmt = select(func.count()).select_from(FingerExercise).where(FingerExercise.lesson_id == lesson_id)
        if active_only:
            stmt = stmt.where(FingerExercise.is_active.is_(True))
        return int(self.db.scalar(stmt) or 0)

    def count_active_lessons_with_exercises(self, lesson_ids: list[int]) -> int:
        if not lesson_ids:
            return 0
        stmt = (
            select(func.count(func.distinct(FingerExercise.lesson_id)))
            .where(
                FingerExercise.lesson_id.in_(lesson_ids),
                FingerExercise.is_active.is_(True),
            )
        )
        return int(self.db.scalar(stmt) or 0)
