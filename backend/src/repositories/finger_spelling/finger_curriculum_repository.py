"""Data access for finger spelling curriculum (units -> chapters -> lessons -> letters).

Learner-facing queries: ``active_only=True`` restricts results to rows that are
both active (not soft-deleted) and published (confirm-publish workflow).
"""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from src.models.finger_spelling import (
    FingerChapter,
    FingerLesson,
    FingerLessonLetter,
    FingerLetter,
    FingerLetterMedia,
    FingerUnit,
)
from src.models.media import Media
from src.models.publishable import live


class FingerCurriculumRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # --- Units ---

    def list_units(self, *, active_only: bool = True) -> list[FingerUnit]:
        stmt = select(FingerUnit).order_by(FingerUnit.order_index)
        if active_only:
            stmt = stmt.where(live(FingerUnit))
        return list(self.db.scalars(stmt).all())

    def get_unit_by_id(self, unit_id: int, *, active_only: bool = True) -> FingerUnit | None:
        stmt = select(FingerUnit).where(FingerUnit.id == unit_id)
        if active_only:
            stmt = stmt.where(live(FingerUnit))
        return self.db.scalars(stmt).first()

    def count_chapters(self, unit_id: int, *, active_only: bool = True) -> int:
        stmt = select(func.count()).select_from(FingerChapter).where(FingerChapter.unit_id == unit_id)
        if active_only:
            stmt = stmt.where(live(FingerChapter))
        return int(self.db.scalar(stmt) or 0)

    def count_lessons_in_unit(self, unit_id: int, *, active_only: bool = True) -> int:
        stmt = (
            select(func.count())
            .select_from(FingerLesson)
            .join(FingerChapter, FingerLesson.chapter_id == FingerChapter.id)
            .where(FingerChapter.unit_id == unit_id)
        )
        if active_only:
            stmt = stmt.where(live(FingerLesson), live(FingerChapter))
        return int(self.db.scalar(stmt) or 0)

    # --- Chapters ---

    def list_chapters_by_unit(self, unit_id: int, *, active_only: bool = True) -> list[FingerChapter]:
        stmt = (
            select(FingerChapter)
            .where(FingerChapter.unit_id == unit_id)
            .order_by(FingerChapter.order_index)
        )
        if active_only:
            stmt = stmt.where(live(FingerChapter))
        return list(self.db.scalars(stmt).all())

    def get_chapter_by_id(self, chapter_id: int, *, active_only: bool = True) -> FingerChapter | None:
        stmt = select(FingerChapter).where(FingerChapter.id == chapter_id)
        if active_only:
            stmt = stmt.where(live(FingerChapter))
        return self.db.scalars(stmt).first()

    def get_chapter_in_unit(
        self, unit_id: int, chapter_id: int, *, active_only: bool = True
    ) -> FingerChapter | None:
        stmt = select(FingerChapter).where(
            FingerChapter.id == chapter_id,
            FingerChapter.unit_id == unit_id,
        )
        if active_only:
            stmt = stmt.where(live(FingerChapter))
        return self.db.scalars(stmt).first()

    def count_lessons(self, chapter_id: int, *, active_only: bool = True) -> int:
        stmt = select(func.count()).select_from(FingerLesson).where(FingerLesson.chapter_id == chapter_id)
        if active_only:
            stmt = stmt.where(live(FingerLesson))
        return int(self.db.scalar(stmt) or 0)

    # --- Lessons ---

    def list_lessons_by_chapter(self, chapter_id: int, *, active_only: bool = True) -> list[FingerLesson]:
        stmt = (
            select(FingerLesson)
            .where(FingerLesson.chapter_id == chapter_id)
            .order_by(FingerLesson.order_index)
        )
        if active_only:
            stmt = stmt.where(live(FingerLesson))
        return list(self.db.scalars(stmt).all())

    def get_lesson_by_id(self, lesson_id: int, *, active_only: bool = True) -> FingerLesson | None:
        stmt = select(FingerLesson).where(FingerLesson.id == lesson_id)
        if active_only:
            stmt = stmt.where(live(FingerLesson))
        return self.db.scalars(stmt).first()

    def get_lesson_in_chapter(
        self, chapter_id: int, lesson_id: int, *, active_only: bool = True
    ) -> FingerLesson | None:
        stmt = select(FingerLesson).where(
            FingerLesson.id == lesson_id,
            FingerLesson.chapter_id == chapter_id,
        )
        if active_only:
            stmt = stmt.where(live(FingerLesson))
        return self.db.scalars(stmt).first()

    def get_lesson_in_hierarchy(
        self,
        unit_id: int,
        chapter_id: int,
        lesson_id: int,
        *,
        active_only: bool = True,
    ) -> FingerLesson | None:
        stmt = (
            select(FingerLesson)
            .join(FingerChapter, FingerLesson.chapter_id == FingerChapter.id)
            .where(
                FingerLesson.id == lesson_id,
                FingerLesson.chapter_id == chapter_id,
                FingerChapter.unit_id == unit_id,
            )
        )
        if active_only:
            stmt = stmt.where(
                live(FingerLesson),
                live(FingerChapter),
            )
        return self.db.scalars(stmt).first()

    def get_lesson_with_chapter(self, lesson_id: int, *, active_only: bool = True) -> FingerLesson | None:
        stmt = (
            select(FingerLesson)
            .options(joinedload(FingerLesson.chapter).joinedload(FingerChapter.unit))
            .where(FingerLesson.id == lesson_id)
        )
        if active_only:
            stmt = stmt.where(live(FingerLesson))
        return self.db.scalars(stmt).first()

    # --- Letters ---

    def list_letters_for_lesson(
        self, lesson_id: int, *, active_only: bool = True
    ) -> list[tuple[FingerLessonLetter, FingerLetter]]:
        stmt = (
            select(FingerLessonLetter, FingerLetter)
            .join(FingerLetter, FingerLessonLetter.letter_id == FingerLetter.id)
            .where(FingerLessonLetter.lesson_id == lesson_id)
            .order_by(FingerLessonLetter.order_index)
        )
        if active_only:
            stmt = stmt.where(FingerLetter.is_active.is_(True))
        return list(self.db.execute(stmt).all())

    def get_letter_by_id(self, letter_id: int, *, active_only: bool = True) -> FingerLetter | None:
        stmt = select(FingerLetter).where(FingerLetter.id == letter_id)
        if active_only:
            stmt = stmt.where(FingerLetter.is_active.is_(True))
        return self.db.scalars(stmt).first()

    def get_letter_with_medias(self, letter_id: int, *, active_only: bool = True) -> FingerLetter | None:
        stmt = (
            select(FingerLetter)
            .options(
                selectinload(FingerLetter.letter_medias).joinedload(FingerLetterMedia.media)
            )
            .where(FingerLetter.id == letter_id)
        )
        if active_only:
            stmt = stmt.where(FingerLetter.is_active.is_(True))
        return self.db.scalars(stmt).unique().first()

    def list_medias_for_letter(self, letter_id: int) -> list[Media]:
        stmt = (
            select(Media)
            .join(FingerLetterMedia, FingerLetterMedia.media_id == Media.id)
            .where(FingerLetterMedia.letter_id == letter_id)
            .order_by(FingerLetterMedia.id)
        )
        return list(self.db.scalars(stmt).all())

    def get_primary_letter_for_lesson(
        self, lesson_id: int, *, active_only: bool = True
    ) -> FingerLetter | None:
        """Return the first letter linked to a lesson (1:1 in current seed data)."""
        rows = self.list_letters_for_lesson(lesson_id, active_only=active_only)
        if not rows:
            return None
        return rows[0][1]

    def get_letter_by_kh(self, letter_kh: str, *, active_only: bool = True) -> FingerLetter | None:
        stmt = select(FingerLetter).where(FingerLetter.letter_kh == letter_kh)
        if active_only:
            stmt = stmt.where(FingerLetter.is_active.is_(True))
        return self.db.scalars(stmt).first()

    def letter_belongs_to_lesson(
        self, lesson_id: int, letter_id: int, *, active_only: bool = True
    ) -> bool:
        stmt = select(FingerLessonLetter.id).where(
            FingerLessonLetter.lesson_id == lesson_id,
            FingerLessonLetter.letter_id == letter_id,
        )
        if active_only:
            stmt = stmt.join(FingerLetter, FingerLessonLetter.letter_id == FingerLetter.id).where(
                FingerLetter.is_active.is_(True)
            )
        return self.db.scalar(stmt) is not None

    def list_lesson_paths_for_letter(
        self, letter_id: int, *, active_only: bool = True
    ) -> list[tuple[FingerLesson, FingerChapter, FingerUnit]]:
        stmt = (
            select(FingerLesson, FingerChapter, FingerUnit)
            .join(FingerLessonLetter, FingerLessonLetter.lesson_id == FingerLesson.id)
            .join(FingerChapter, FingerLesson.chapter_id == FingerChapter.id)
            .join(FingerUnit, FingerChapter.unit_id == FingerUnit.id)
            .where(FingerLessonLetter.letter_id == letter_id)
            .order_by(FingerUnit.order_index, FingerChapter.order_index, FingerLesson.order_index)
        )
        if active_only:
            stmt = stmt.where(
                live(FingerLesson),
                live(FingerChapter),
                live(FingerUnit),
            )
        return list(self.db.execute(stmt).all())

    def list_lesson_ids_for_chapter(self, chapter_id: int, *, active_only: bool = True) -> list[int]:
        lessons = self.list_lessons_by_chapter(chapter_id, active_only=active_only)
        return [lesson.id for lesson in lessons]

    def list_lesson_ids_for_unit(self, unit_id: int, *, active_only: bool = True) -> list[int]:
        stmt = (
            select(FingerLesson.id)
            .join(FingerChapter, FingerLesson.chapter_id == FingerChapter.id)
            .where(FingerChapter.unit_id == unit_id)
            .order_by(FingerChapter.order_index, FingerLesson.order_index)
        )
        if active_only:
            stmt = stmt.where(
                live(FingerLesson),
                live(FingerChapter),
            )
        return list(self.db.scalars(stmt).all())

    def list_lessons_in_curriculum_order(
        self, *, active_only: bool = True
    ) -> list[FingerLesson]:
        """All lessons flattened in unit -> chapter -> lesson order."""
        stmt = (
            select(FingerLesson)
            .join(FingerChapter, FingerLesson.chapter_id == FingerChapter.id)
            .join(FingerUnit, FingerChapter.unit_id == FingerUnit.id)
            .order_by(
                FingerUnit.order_index,
                FingerChapter.order_index,
                FingerLesson.order_index,
            )
        )
        if active_only:
            stmt = stmt.where(
                live(FingerLesson),
                live(FingerChapter),
                live(FingerUnit),
            )
        return list(self.db.scalars(stmt).all())

    def get_first_lesson_in_curriculum(
        self, *, active_only: bool = True
    ) -> FingerLesson | None:
        lessons = self.list_lessons_in_curriculum_order(active_only=active_only)
        return lessons[0] if lessons else None

    def get_prior_lesson_in_curriculum_order(
        self, lesson_id: int, *, active_only: bool = True
    ) -> FingerLesson | None:
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
