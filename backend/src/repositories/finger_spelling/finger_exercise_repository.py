"""Data access for finger spelling lesson exercises and options."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload, with_loader_criteria

from src.models.finger_spelling import FingerExercise, FingerExerciseOption, FingerLesson
from src.models.publishable import live


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
            stmt = stmt.where(live(FingerExercise))
        return list(self.db.scalars(stmt).all())

    def list_with_options_by_lesson(
        self, lesson_id: int, *, active_only: bool = True
    ) -> list[FingerExercise]:
        load_options = selectinload(FingerExercise.options)
        stmt = select(FingerExercise).options(load_options, joinedload(FingerExercise.media))
        if active_only:
            stmt = stmt.options(
                with_loader_criteria(
                    FingerExerciseOption,
                    FingerExerciseOption.is_active.is_(True),
                    include_aliases=True,
                )
            )
        stmt = stmt.where(FingerExercise.lesson_id == lesson_id).order_by(FingerExercise.order_index)
        if active_only:
            stmt = stmt.where(live(FingerExercise))
        return list(self.db.scalars(stmt).unique().all())

    def list_with_options_by_chapter(
        self, chapter_id: int, *, active_only: bool = True
    ) -> list[FingerExercise]:
        load_options = selectinload(FingerExercise.options)
        stmt = (
            select(FingerExercise)
            .join(FingerLesson, FingerExercise.lesson_id == FingerLesson.id)
            .options(load_options, joinedload(FingerExercise.media))
        )
        if active_only:
            stmt = stmt.options(
                with_loader_criteria(
                    FingerExerciseOption,
                    FingerExerciseOption.is_active.is_(True),
                    include_aliases=True,
                )
            )
        stmt = stmt.where(FingerLesson.chapter_id == chapter_id).order_by(
            FingerLesson.order_index, FingerExercise.order_index
        )
        if active_only:
            stmt = stmt.where(live(FingerExercise))
        return list(self.db.scalars(stmt).unique().all())

    def get_by_id(self, exercise_id: int, *, active_only: bool = True) -> FingerExercise | None:
        stmt = select(FingerExercise).where(FingerExercise.id == exercise_id)
        if active_only:
            stmt = stmt.where(live(FingerExercise))
        return self.db.scalars(stmt).first()

    def get_with_options(
        self, exercise_id: int, *, active_only: bool = True
    ) -> FingerExercise | None:
        load_options = selectinload(FingerExercise.options).joinedload(FingerExerciseOption.media)
        stmt = select(FingerExercise).options(load_options, joinedload(FingerExercise.media))
        if active_only:
            stmt = stmt.options(
                with_loader_criteria(
                    FingerExerciseOption,
                    FingerExerciseOption.is_active.is_(True),
                    include_aliases=True,
                )
            )
        stmt = stmt.where(FingerExercise.id == exercise_id)
        if active_only:
            stmt = stmt.where(live(FingerExercise))
        return self.db.scalars(stmt).unique().first()

    def get_option_by_id(self, option_id: int) -> FingerExerciseOption | None:
        stmt = select(FingerExerciseOption).where(
            FingerExerciseOption.id == option_id,
            FingerExerciseOption.is_active.is_(True),
        )
        return self.db.scalars(stmt).first()

    def count_by_lesson(self, lesson_id: int, *, active_only: bool = True) -> int:
        stmt = select(func.count()).select_from(FingerExercise).where(
            FingerExercise.lesson_id == lesson_id
        )
        if active_only:
            stmt = stmt.where(live(FingerExercise))
        return int(self.db.scalar(stmt) or 0)

    def count_by_chapter(self, chapter_id: int, *, active_only: bool = True) -> int:
        stmt = (
            select(func.count())
            .select_from(FingerExercise)
            .join(FingerLesson, FingerExercise.lesson_id == FingerLesson.id)
            .where(FingerLesson.chapter_id == chapter_id)
        )
        if active_only:
            stmt = stmt.where(live(FingerExercise))
        return int(self.db.scalar(stmt) or 0)
