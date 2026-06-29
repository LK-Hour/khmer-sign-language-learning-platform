"""Data access for word detection lesson exercises and options."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from src.models.word_detection import (
    WordDetectionExercise,
    WordDetectionExerciseOption,
    WordDetectionLesson,
)


class WordDetectionExerciseRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_by_lesson(
        self, lesson_id: int, *, active_only: bool = True
    ) -> list[WordDetectionExercise]:
        stmt = (
            select(WordDetectionExercise)
            .where(WordDetectionExercise.lesson_id == lesson_id)
            .order_by(WordDetectionExercise.order_index)
        )
        if active_only:
            stmt = stmt.where(WordDetectionExercise.is_active.is_(True))
        return list(self.db.scalars(stmt).all())

    def list_with_options_by_lesson(
        self, lesson_id: int, *, active_only: bool = True
    ) -> list[WordDetectionExercise]:
        stmt = (
            select(WordDetectionExercise)
            .options(
                selectinload(WordDetectionExercise.options),
                joinedload(WordDetectionExercise.media),
            )
            .where(WordDetectionExercise.lesson_id == lesson_id)
            .order_by(WordDetectionExercise.order_index)
        )
        if active_only:
            stmt = stmt.where(WordDetectionExercise.is_active.is_(True))
        return list(self.db.scalars(stmt).unique().all())

    def list_with_options_by_chapter(
        self, chapter_id: int, *, active_only: bool = True
    ) -> list[WordDetectionExercise]:
        stmt = (
            select(WordDetectionExercise)
            .join(WordDetectionLesson, WordDetectionExercise.lesson_id == WordDetectionLesson.id)
            .options(
                selectinload(WordDetectionExercise.options),
                joinedload(WordDetectionExercise.media),
            )
            .where(WordDetectionLesson.chapter_id == chapter_id)
            .order_by(WordDetectionLesson.order_index, WordDetectionExercise.order_index)
        )
        if active_only:
            stmt = stmt.where(WordDetectionExercise.is_active.is_(True))
        return list(self.db.scalars(stmt).unique().all())

    def get_by_id(
        self, exercise_id: int, *, active_only: bool = True
    ) -> WordDetectionExercise | None:
        stmt = select(WordDetectionExercise).where(WordDetectionExercise.id == exercise_id)
        if active_only:
            stmt = stmt.where(WordDetectionExercise.is_active.is_(True))
        return self.db.scalars(stmt).first()

    def get_with_options(
        self, exercise_id: int, *, active_only: bool = True
    ) -> WordDetectionExercise | None:
        stmt = (
            select(WordDetectionExercise)
            .options(
                selectinload(WordDetectionExercise.options).joinedload(
                    WordDetectionExerciseOption.media
                ),
                joinedload(WordDetectionExercise.media),
            )
            .where(WordDetectionExercise.id == exercise_id)
        )
        if active_only:
            stmt = stmt.where(WordDetectionExercise.is_active.is_(True))
        return self.db.scalars(stmt).unique().first()

    def get_option_by_id(self, option_id: int) -> WordDetectionExerciseOption | None:
        return self.db.get(WordDetectionExerciseOption, option_id)

    def count_by_lesson(self, lesson_id: int, *, active_only: bool = True) -> int:
        stmt = select(func.count()).select_from(WordDetectionExercise).where(
            WordDetectionExercise.lesson_id == lesson_id
        )
        if active_only:
            stmt = stmt.where(WordDetectionExercise.is_active.is_(True))
        return int(self.db.scalar(stmt) or 0)

    def count_by_chapter(self, chapter_id: int, *, active_only: bool = True) -> int:
        stmt = (
            select(func.count())
            .select_from(WordDetectionExercise)
            .join(WordDetectionLesson, WordDetectionExercise.lesson_id == WordDetectionLesson.id)
            .where(WordDetectionLesson.chapter_id == chapter_id)
        )
        if active_only:
            stmt = stmt.where(WordDetectionExercise.is_active.is_(True))
        return int(self.db.scalar(stmt) or 0)
