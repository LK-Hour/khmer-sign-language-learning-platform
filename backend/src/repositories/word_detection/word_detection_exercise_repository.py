"""Data access for word detection lesson exercises and options."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload, with_loader_criteria

from src.models.publishable import live
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
            stmt = stmt.where(live(WordDetectionExercise))
        return list(self.db.scalars(stmt).all())

    def list_with_options_by_lesson(
        self, lesson_id: int, *, active_only: bool = True
    ) -> list[WordDetectionExercise]:
        load_options = selectinload(WordDetectionExercise.options)
        stmt = select(WordDetectionExercise).options(
            load_options,
            joinedload(WordDetectionExercise.media),
        )
        if active_only:
            stmt = stmt.options(
                with_loader_criteria(
                    WordDetectionExerciseOption,
                    WordDetectionExerciseOption.is_active.is_(True),
                    include_aliases=True,
                )
            )
        stmt = stmt.where(WordDetectionExercise.lesson_id == lesson_id).order_by(
            WordDetectionExercise.order_index
        )
        if active_only:
            stmt = stmt.where(live(WordDetectionExercise))
        return list(self.db.scalars(stmt).unique().all())

    def list_with_options_by_chapter(
        self, chapter_id: int, *, active_only: bool = True
    ) -> list[WordDetectionExercise]:
        load_options = selectinload(WordDetectionExercise.options)
        stmt = (
            select(WordDetectionExercise)
            .join(WordDetectionLesson, WordDetectionExercise.lesson_id == WordDetectionLesson.id)
            .options(load_options, joinedload(WordDetectionExercise.media))
        )
        if active_only:
            stmt = stmt.options(
                with_loader_criteria(
                    WordDetectionExerciseOption,
                    WordDetectionExerciseOption.is_active.is_(True),
                    include_aliases=True,
                )
            )
        stmt = stmt.where(WordDetectionLesson.chapter_id == chapter_id).order_by(
            WordDetectionLesson.order_index, WordDetectionExercise.order_index
        )
        if active_only:
            stmt = stmt.where(live(WordDetectionExercise))
        return list(self.db.scalars(stmt).unique().all())

    def get_by_id(
        self, exercise_id: int, *, active_only: bool = True
    ) -> WordDetectionExercise | None:
        stmt = select(WordDetectionExercise).where(WordDetectionExercise.id == exercise_id)
        if active_only:
            stmt = stmt.where(live(WordDetectionExercise))
        return self.db.scalars(stmt).first()

    def get_with_options(
        self, exercise_id: int, *, active_only: bool = True
    ) -> WordDetectionExercise | None:
        load_options = selectinload(WordDetectionExercise.options).joinedload(
            WordDetectionExerciseOption.media
        )
        stmt = select(WordDetectionExercise).options(
            load_options,
            joinedload(WordDetectionExercise.media),
        )
        if active_only:
            stmt = stmt.options(
                with_loader_criteria(
                    WordDetectionExerciseOption,
                    WordDetectionExerciseOption.is_active.is_(True),
                    include_aliases=True,
                )
            )
        stmt = stmt.where(WordDetectionExercise.id == exercise_id)
        if active_only:
            stmt = stmt.where(live(WordDetectionExercise))
        return self.db.scalars(stmt).unique().first()

    def get_option_by_id(self, option_id: int) -> WordDetectionExerciseOption | None:
        stmt = select(WordDetectionExerciseOption).where(
            WordDetectionExerciseOption.id == option_id,
            WordDetectionExerciseOption.is_active.is_(True),
        )
        return self.db.scalars(stmt).first()

    def count_by_lesson(self, lesson_id: int, *, active_only: bool = True) -> int:
        stmt = select(func.count()).select_from(WordDetectionExercise).where(
            WordDetectionExercise.lesson_id == lesson_id
        )
        if active_only:
            stmt = stmt.where(live(WordDetectionExercise))
        return int(self.db.scalar(stmt) or 0)

    def count_by_chapter(self, chapter_id: int, *, active_only: bool = True) -> int:
        stmt = (
            select(func.count())
            .select_from(WordDetectionExercise)
            .join(WordDetectionLesson, WordDetectionExercise.lesson_id == WordDetectionLesson.id)
            .where(WordDetectionLesson.chapter_id == chapter_id)
        )
        if active_only:
            stmt = stmt.where(live(WordDetectionExercise))
        return int(self.db.scalar(stmt) or 0)
