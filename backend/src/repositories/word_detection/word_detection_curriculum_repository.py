"""Data access for word detection curriculum (units -> chapters -> lessons -> words).

Learner-facing queries: ``active_only=True`` restricts results to rows that are
both active (not soft-deleted) and published (confirm-publish workflow).
"""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from src.models.word_detection import (
    WordDetectionChapter,
    WordDetectionLesson,
    WordDetectionLessonWord,
    WordDetectionWord,
    WordDetectionWordMedia,
    WordDetectionUnit,
)
from src.models.media import Media
from src.models.publishable import live


class WordDetectionCurriculumRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # --- Units ---

    def list_units(self, *, active_only: bool = True) -> list[WordDetectionUnit]:
        stmt = select(WordDetectionUnit).order_by(WordDetectionUnit.order_index)
        if active_only:
            stmt = stmt.where(live(WordDetectionUnit))
        return list(self.db.scalars(stmt).all())

    def get_unit_by_id(self, unit_id: int, *, active_only: bool = True) -> WordDetectionUnit | None:
        stmt = select(WordDetectionUnit).where(WordDetectionUnit.id == unit_id)
        if active_only:
            stmt = stmt.where(live(WordDetectionUnit))
        return self.db.scalars(stmt).first()

    def count_chapters(self, unit_id: int, *, active_only: bool = True) -> int:
        stmt = select(func.count()).select_from(WordDetectionChapter).where(
            WordDetectionChapter.unit_id == unit_id
        )
        if active_only:
            stmt = stmt.where(live(WordDetectionChapter))
        return int(self.db.scalar(stmt) or 0)

    def count_lessons_in_unit(self, unit_id: int, *, active_only: bool = True) -> int:
        stmt = (
            select(func.count())
            .select_from(WordDetectionLesson)
            .join(WordDetectionChapter, WordDetectionLesson.chapter_id == WordDetectionChapter.id)
            .where(WordDetectionChapter.unit_id == unit_id)
        )
        if active_only:
            stmt = stmt.where(
                live(WordDetectionLesson),
                live(WordDetectionChapter),
            )
        return int(self.db.scalar(stmt) or 0)

    # --- Chapters ---

    def list_chapters_by_unit(
        self, unit_id: int, *, active_only: bool = True
    ) -> list[WordDetectionChapter]:
        stmt = (
            select(WordDetectionChapter)
            .where(WordDetectionChapter.unit_id == unit_id)
            .order_by(WordDetectionChapter.order_index)
        )
        if active_only:
            stmt = stmt.where(live(WordDetectionChapter))
        return list(self.db.scalars(stmt).all())

    def get_chapter_by_id(
        self, chapter_id: int, *, active_only: bool = True
    ) -> WordDetectionChapter | None:
        stmt = select(WordDetectionChapter).where(WordDetectionChapter.id == chapter_id)
        if active_only:
            stmt = stmt.where(live(WordDetectionChapter))
        return self.db.scalars(stmt).first()

    def get_chapter_in_unit(
        self, unit_id: int, chapter_id: int, *, active_only: bool = True
    ) -> WordDetectionChapter | None:
        stmt = select(WordDetectionChapter).where(
            WordDetectionChapter.id == chapter_id,
            WordDetectionChapter.unit_id == unit_id,
        )
        if active_only:
            stmt = stmt.where(live(WordDetectionChapter))
        return self.db.scalars(stmt).first()

    def count_lessons(self, chapter_id: int, *, active_only: bool = True) -> int:
        stmt = select(func.count()).select_from(WordDetectionLesson).where(
            WordDetectionLesson.chapter_id == chapter_id
        )
        if active_only:
            stmt = stmt.where(live(WordDetectionLesson))
        return int(self.db.scalar(stmt) or 0)

    # --- Lessons ---

    def list_lessons_by_chapter(
        self, chapter_id: int, *, active_only: bool = True
    ) -> list[WordDetectionLesson]:
        stmt = (
            select(WordDetectionLesson)
            .where(WordDetectionLesson.chapter_id == chapter_id)
            .order_by(WordDetectionLesson.order_index)
        )
        if active_only:
            stmt = stmt.where(live(WordDetectionLesson))
        return list(self.db.scalars(stmt).all())

    def get_lesson_by_id(
        self, lesson_id: int, *, active_only: bool = True
    ) -> WordDetectionLesson | None:
        stmt = select(WordDetectionLesson).where(WordDetectionLesson.id == lesson_id)
        if active_only:
            stmt = stmt.where(live(WordDetectionLesson))
        return self.db.scalars(stmt).first()

    def get_lesson_in_chapter(
        self, chapter_id: int, lesson_id: int, *, active_only: bool = True
    ) -> WordDetectionLesson | None:
        stmt = select(WordDetectionLesson).where(
            WordDetectionLesson.id == lesson_id,
            WordDetectionLesson.chapter_id == chapter_id,
        )
        if active_only:
            stmt = stmt.where(live(WordDetectionLesson))
        return self.db.scalars(stmt).first()

    def get_lesson_in_hierarchy(
        self,
        unit_id: int,
        chapter_id: int,
        lesson_id: int,
        *,
        active_only: bool = True,
    ) -> WordDetectionLesson | None:
        stmt = (
            select(WordDetectionLesson)
            .join(WordDetectionChapter, WordDetectionLesson.chapter_id == WordDetectionChapter.id)
            .where(
                WordDetectionLesson.id == lesson_id,
                WordDetectionLesson.chapter_id == chapter_id,
                WordDetectionChapter.unit_id == unit_id,
            )
        )
        if active_only:
            stmt = stmt.where(
                live(WordDetectionLesson),
                live(WordDetectionChapter),
            )
        return self.db.scalars(stmt).first()

    def get_lesson_with_chapter(
        self, lesson_id: int, *, active_only: bool = True
    ) -> WordDetectionLesson | None:
        stmt = (
            select(WordDetectionLesson)
            .options(
                joinedload(WordDetectionLesson.chapter).joinedload(WordDetectionChapter.unit)
            )
            .where(WordDetectionLesson.id == lesson_id)
        )
        if active_only:
            stmt = stmt.where(live(WordDetectionLesson))
        return self.db.scalars(stmt).first()

    # --- Words ---

    def list_words_for_lesson(
        self, lesson_id: int, *, active_only: bool = True
    ) -> list[tuple[WordDetectionLessonWord, WordDetectionWord]]:
        stmt = (
            select(WordDetectionLessonWord, WordDetectionWord)
            .join(WordDetectionWord, WordDetectionLessonWord.word_id == WordDetectionWord.id)
            .where(WordDetectionLessonWord.lesson_id == lesson_id)
            .order_by(WordDetectionLessonWord.order_index)
        )
        if active_only:
            stmt = stmt.where(WordDetectionWord.is_active.is_(True))
        return list(self.db.execute(stmt).all())

    def get_word_by_id(
        self, word_id: int, *, active_only: bool = True
    ) -> WordDetectionWord | None:
        stmt = select(WordDetectionWord).where(WordDetectionWord.id == word_id)
        if active_only:
            stmt = stmt.where(WordDetectionWord.is_active.is_(True))
        return self.db.scalars(stmt).first()

    def list_all_words(self, *, active_only: bool = True) -> list[WordDetectionWord]:
        stmt = select(WordDetectionWord).order_by(WordDetectionWord.id)
        if active_only:
            stmt = stmt.where(WordDetectionWord.is_active.is_(True))
        return list(self.db.scalars(stmt).all())

    def get_word_with_medias(
        self, word_id: int, *, active_only: bool = True
    ) -> WordDetectionWord | None:
        stmt = (
            select(WordDetectionWord)
            .options(
                selectinload(WordDetectionWord.word_medias).joinedload(WordDetectionWordMedia.media)
            )
            .where(WordDetectionWord.id == word_id)
        )
        if active_only:
            stmt = stmt.where(WordDetectionWord.is_active.is_(True))
        return self.db.scalars(stmt).unique().first()

    def list_medias_for_word(self, word_id: int) -> list[Media]:
        stmt = (
            select(Media)
            .join(WordDetectionWordMedia, WordDetectionWordMedia.media_id == Media.id)
            .where(WordDetectionWordMedia.word_id == word_id)
            .order_by(WordDetectionWordMedia.id)
        )
        return list(self.db.scalars(stmt).all())

    def get_primary_word_for_lesson(
        self, lesson_id: int, *, active_only: bool = True
    ) -> WordDetectionWord | None:
        """Return the first word linked to a lesson (1:1 in current seed data)."""
        rows = self.list_words_for_lesson(lesson_id, active_only=active_only)
        if not rows:
            return None
        return rows[0][1]

    def get_word_by_kh(
        self, word_kh: str, *, active_only: bool = True
    ) -> WordDetectionWord | None:
        stmt = select(WordDetectionWord).where(WordDetectionWord.word_kh == word_kh)
        if active_only:
            stmt = stmt.where(WordDetectionWord.is_active.is_(True))
        return self.db.scalars(stmt).first()

    def word_belongs_to_lesson(
        self, lesson_id: int, word_id: int, *, active_only: bool = True
    ) -> bool:
        stmt = select(WordDetectionLessonWord.id).where(
            WordDetectionLessonWord.lesson_id == lesson_id,
            WordDetectionLessonWord.word_id == word_id,
        )
        if active_only:
            stmt = stmt.join(
                WordDetectionWord, WordDetectionLessonWord.word_id == WordDetectionWord.id
            ).where(WordDetectionWord.is_active.is_(True))
        return self.db.scalar(stmt) is not None

    def list_lesson_paths_for_word(
        self, word_id: int, *, active_only: bool = True
    ) -> list[tuple[WordDetectionLesson, WordDetectionChapter, WordDetectionUnit]]:
        stmt = (
            select(WordDetectionLesson, WordDetectionChapter, WordDetectionUnit)
            .join(
                WordDetectionLessonWord,
                WordDetectionLessonWord.lesson_id == WordDetectionLesson.id,
            )
            .join(WordDetectionChapter, WordDetectionLesson.chapter_id == WordDetectionChapter.id)
            .join(WordDetectionUnit, WordDetectionChapter.unit_id == WordDetectionUnit.id)
            .where(WordDetectionLessonWord.word_id == word_id)
            .order_by(
                WordDetectionUnit.order_index,
                WordDetectionChapter.order_index,
                WordDetectionLesson.order_index,
            )
        )
        if active_only:
            stmt = stmt.where(
                live(WordDetectionLesson),
                live(WordDetectionChapter),
                live(WordDetectionUnit),
            )
        return list(self.db.execute(stmt).all())

    def list_lesson_ids_for_chapter(
        self, chapter_id: int, *, active_only: bool = True
    ) -> list[int]:
        lessons = self.list_lessons_by_chapter(chapter_id, active_only=active_only)
        return [lesson.id for lesson in lessons]

    def list_lesson_ids_for_unit(
        self, unit_id: int, *, active_only: bool = True
    ) -> list[int]:
        stmt = (
            select(WordDetectionLesson.id)
            .join(WordDetectionChapter, WordDetectionLesson.chapter_id == WordDetectionChapter.id)
            .where(WordDetectionChapter.unit_id == unit_id)
            .order_by(WordDetectionChapter.order_index, WordDetectionLesson.order_index)
        )
        if active_only:
            stmt = stmt.where(
                live(WordDetectionLesson),
                live(WordDetectionChapter),
            )
        return list(self.db.scalars(stmt).all())

    def list_lessons_in_curriculum_order(
        self, *, active_only: bool = True
    ) -> list[WordDetectionLesson]:
        """All lessons flattened in unit -> chapter -> lesson order."""
        stmt = (
            select(WordDetectionLesson)
            .join(WordDetectionChapter, WordDetectionLesson.chapter_id == WordDetectionChapter.id)
            .join(WordDetectionUnit, WordDetectionChapter.unit_id == WordDetectionUnit.id)
            .order_by(
                WordDetectionUnit.order_index,
                WordDetectionChapter.order_index,
                WordDetectionLesson.order_index,
            )
        )
        if active_only:
            stmt = stmt.where(
                live(WordDetectionLesson),
                live(WordDetectionChapter),
                live(WordDetectionUnit),
            )
        return list(self.db.scalars(stmt).all())

    def get_first_lesson_in_curriculum(
        self, *, active_only: bool = True
    ) -> WordDetectionLesson | None:
        lessons = self.list_lessons_in_curriculum_order(active_only=active_only)
        return lessons[0] if lessons else None

    def get_prior_lesson_in_curriculum_order(
        self, lesson_id: int, *, active_only: bool = True
    ) -> WordDetectionLesson | None:
        lessons = self.list_lessons_in_curriculum_order(active_only=active_only)
        for index, lesson in enumerate(lessons):
            if lesson.id == lesson_id:
                return lessons[index - 1] if index > 0 else None
        return None

    def is_first_lesson_in_curriculum(
        self, lesson_id: int, *, active_only: bool = True
    ) -> bool:
        first = self.get_first_lesson_in_curriculum(active_only=active_only)
        return first is not None and first.id == lesson_id
