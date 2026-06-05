"""Business logic for finger spelling curriculum reads and admin CRUD operations."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from src.models.finger_spelling import (
    FingerChapter,
    FingerLesson,
    FingerLetter,
    FingerUnit,
)
from src.models.media import Media
from src.repositories.base.base_crud_repository import BaseCrudRepository
from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.repositories.finger_spelling.finger_progress_repository import (
    FingerProgressRepository,
)
from src.schemas.admin.curriculum import (
    ChapterCreate,
    ChapterResponse,
    ChapterUpdate,
    LessonCreate,
    LessonResponse,
    LessonUpdate,
    UnitCreate,
    UnitResponse,
    UnitUpdate,
)
from src.services.registry.track_registry import get_track_config


@dataclass
class LetterWithMedia:
    letter: FingerLetter
    order_index: int
    medias: list[Media] = field(default_factory=list)


@dataclass
class LessonDetailBundle:
    lesson: FingerLesson
    chapter: FingerChapter
    unit: FingerUnit
    letters: list[LetterWithMedia]


@dataclass
class LessonPathRow:
    lesson: FingerLesson
    chapter: FingerChapter
    unit: FingerUnit


@dataclass
class LetterDataBundle:
    letter: FingerLetter
    medias: list[Media]
    lesson_paths: list[LessonPathRow]


class FingerCurriculumService:
    """Learner-facing curriculum queries + admin CRUD operations."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.curriculum = FingerCurriculumRepository(db)
        self.progress = FingerProgressRepository(db)
        # Admin CRUD repositories
        self.cfg = get_track_config("finger")
        self.units = BaseCrudRepository(db, self.cfg.unit_model)
        self.chapters = BaseCrudRepository(db, self.cfg.chapter_model)
        self.lessons = BaseCrudRepository(db, self.cfg.lesson_model)
        self.exercises = BaseCrudRepository(db, self.cfg.exercise_model)

    def list_units(self, *, active_only: bool = True) -> list[FingerUnit]:
        return self.curriculum.list_units(active_only=active_only)

    def get_unit(self, unit_id: int, *, active_only: bool = True) -> FingerUnit | None:
        return self.curriculum.get_unit_by_id(unit_id, active_only=active_only)

    def list_chapters_for_unit(
        self, unit_id: int, *, active_only: bool = True
    ) -> list[FingerChapter] | None:
        if self.curriculum.get_unit_by_id(unit_id, active_only=active_only) is None:
            return None
        return self.curriculum.list_chapters_by_unit(unit_id, active_only=active_only)

    def get_chapter(
        self, chapter_id: int, *, active_only: bool = True
    ) -> FingerChapter | None:
        return self.curriculum.get_chapter_by_id(chapter_id, active_only=active_only)

    def list_lessons_for_chapter(
        self, chapter_id: int, *, active_only: bool = True
    ) -> list[FingerLesson] | None:
        if self.curriculum.get_chapter_by_id(chapter_id, active_only=active_only) is None:
            return None
        return self.curriculum.list_lessons_by_chapter(chapter_id, active_only=active_only)

    def get_lesson(self, lesson_id: int, *, active_only: bool = True) -> FingerLesson | None:
        return self.curriculum.get_lesson_by_id(lesson_id, active_only=active_only)

    def get_lesson_detail(
        self, lesson_id: int, *, active_only: bool = True
    ) -> LessonDetailBundle | None:
        lesson = self.curriculum.get_lesson_with_chapter(lesson_id, active_only=active_only)
        if lesson is None or lesson.chapter is None:
            return None

        chapter = lesson.chapter
        unit = chapter.unit
        if active_only and (not chapter.is_active or (unit and not unit.is_active)):
            return None

        letters: list[LetterWithMedia] = []
        for junction, letter in self.curriculum.list_letters_for_lesson(
            lesson_id, active_only=active_only
        ):
            medias = self.curriculum.list_medias_for_letter(letter.id)
            letters.append(
                LetterWithMedia(letter=letter, order_index=junction.order_index, medias=medias)
            )

        return LessonDetailBundle(lesson=lesson, chapter=chapter, unit=unit, letters=letters)

    def get_letter(self, letter_id: int, *, active_only: bool = True) -> FingerLetter | None:
        return self.curriculum.get_letter_with_medias(letter_id, active_only=active_only)

    def get_letter_by_kh(self, letter_kh: str, *, active_only: bool = True) -> FingerLetter | None:
        return self.curriculum.get_letter_by_kh(letter_kh, active_only=active_only)

    def get_letter_data_by_kh(
        self, letter_kh: str, *, active_only: bool = True
    ) -> LetterDataBundle | None:
        letter = self.curriculum.get_letter_by_kh(letter_kh, active_only=active_only)
        if letter is None:
            return None

        medias = self.curriculum.list_medias_for_letter(letter.id)
        paths = self.curriculum.list_lesson_paths_for_letter(letter.id, active_only=active_only)
        lesson_paths = [
            LessonPathRow(lesson=lesson, chapter=chapter, unit=unit)
            for lesson, chapter, unit in paths
        ]
        return LetterDataBundle(letter=letter, medias=medias, lesson_paths=lesson_paths)

    def count_chapters(self, unit_id: int, *, active_only: bool = True) -> int:
        return self.curriculum.count_chapters(unit_id, active_only=active_only)

    def count_lessons(self, chapter_id: int, *, active_only: bool = True) -> int:
        return self.curriculum.count_lessons(chapter_id, active_only=active_only)

    def count_lessons_in_unit(self, unit_id: int, *, active_only: bool = True) -> int:
        return self.curriculum.count_lessons_in_unit(unit_id, active_only=active_only)

    def count_completed_lessons(
        self, user_id: uuid.UUID | None, lesson_ids: list[int]
    ) -> int:
        if user_id is None or not lesson_ids:
            return 0
        return self.progress.count_completed_lessons(user_id, lesson_ids)

    def is_chapter_exercise_unlocked(
        self, user_id: uuid.UUID | None, chapter_id: int, *, active_only: bool = True
    ) -> bool:
        """All lessons in the chapter must be completed before chapter exercises unlock."""
        if user_id is None:
            return False
        lessons = self.curriculum.list_lessons_by_chapter(chapter_id, active_only=active_only)
        if not lessons:
            return False
        lesson_ids = [lesson.id for lesson in lessons]
        completed = self.progress.count_completed_lessons(user_id, lesson_ids)
        return completed >= len(lesson_ids)

    # ──────────────────────────────────────────────────────────────────────
    # ADMIN CRUD OPERATIONS
    # ──────────────────────────────────────────────────────────────────────

    # ── Response builders ────────────────────────────────────────────────

    def _unit_response(self, unit) -> UnitResponse:
        data = UnitResponse.model_validate(unit)
        data.chapter_count = self.chapters.count(unit_id=unit.id)
        return data

    def _chapter_response(self, chapter) -> ChapterResponse:
        data = ChapterResponse.model_validate(chapter)
        data.lesson_count = self.lessons.count(chapter_id=chapter.id)
        return data

    def _lesson_response(self, lesson) -> LessonResponse:
        data = LessonResponse.model_validate(lesson)
        data.exercise_count = self.exercises.count(lesson_id=lesson.id)
        return data

    # ── Units ────────────────────────────────────────────────────────────

    def admin_list_units(self, *, active_only: bool = False) -> list[UnitResponse]:
        rows = self.units.list(
            active_only=active_only,
            order_by=[self.cfg.unit_model.order_index],
        )
        return [self._unit_response(u) for u in rows]

    def admin_get_unit(self, unit_id: int) -> UnitResponse | None:
        unit = self.units.get(unit_id)
        return self._unit_response(unit) if unit else None

    def admin_create_unit(self, body: UnitCreate) -> UnitResponse:
        unit = self.units.create(**body.model_dump())
        self.db.commit()
        self.db.refresh(unit)
        return self._unit_response(unit)

    def admin_update_unit(self, unit_id: int, body: UnitUpdate) -> UnitResponse | None:
        unit = self.units.get(unit_id)
        if unit is None:
            return None
        self.units.update(unit, body.model_dump(exclude_unset=True))
        self.db.commit()
        self.db.refresh(unit)
        return self._unit_response(unit)

    def admin_delete_unit(self, unit_id: int) -> UnitResponse | None:
        unit = self.units.get(unit_id)
        if unit is None:
            return None
        self.units.soft_delete(unit)
        self.db.commit()
        self.db.refresh(unit)
        return self._unit_response(unit)

    # ── Chapters ─────────────────────────────────────────────────────────

    def admin_list_chapters(
        self, *, unit_id: int | None = None, active_only: bool = False
    ) -> list[ChapterResponse]:
        filters = {"unit_id": unit_id} if unit_id is not None else None
        rows = self.chapters.list(
            filters=filters,
            active_only=active_only,
            order_by=[
                self.cfg.chapter_model.unit_id,
                self.cfg.chapter_model.order_index,
            ],
        )
        return [self._chapter_response(c) for c in rows]

    def admin_get_chapter(self, chapter_id: int) -> ChapterResponse | None:
        chapter = self.chapters.get(chapter_id)
        return self._chapter_response(chapter) if chapter else None

    def admin_create_chapter(self, body: ChapterCreate) -> ChapterResponse | None:
        if self.units.get(body.unit_id) is None:
            return None
        chapter = self.chapters.create(**body.model_dump())
        self.db.commit()
        self.db.refresh(chapter)
        return self._chapter_response(chapter)

    def admin_update_chapter(
        self, chapter_id: int, body: ChapterUpdate
    ) -> ChapterResponse | None:
        chapter = self.chapters.get(chapter_id)
        if chapter is None:
            return None
        updates = body.model_dump(exclude_unset=True)
        if "unit_id" in updates and self.units.get(updates["unit_id"]) is None:
            return None
        self.chapters.update(chapter, updates)
        self.db.commit()
        self.db.refresh(chapter)
        return self._chapter_response(chapter)

    def admin_delete_chapter(self, chapter_id: int) -> ChapterResponse | None:
        chapter = self.chapters.get(chapter_id)
        if chapter is None:
            return None
        self.chapters.soft_delete(chapter)
        self.db.commit()
        self.db.refresh(chapter)
        return self._chapter_response(chapter)

    # ── Lessons ──────────────────────────────────────────────────────────

    def admin_list_lessons(
        self, *, chapter_id: int | None = None, active_only: bool = False
    ) -> list[LessonResponse]:
        filters = {"chapter_id": chapter_id} if chapter_id is not None else None
        rows = self.lessons.list(
            filters=filters,
            active_only=active_only,
            order_by=[
                self.cfg.lesson_model.chapter_id,
                self.cfg.lesson_model.order_index,
            ],
        )
        return [self._lesson_response(l) for l in rows]

    def admin_get_lesson(self, lesson_id: int) -> LessonResponse | None:
        lesson = self.lessons.get(lesson_id)
        return self._lesson_response(lesson) if lesson else None

    def admin_create_lesson(self, body: LessonCreate) -> LessonResponse | None:
        if self.chapters.get(body.chapter_id) is None:
            return None
        lesson = self.lessons.create(**body.model_dump())
        self.db.commit()
        self.db.refresh(lesson)
        return self._lesson_response(lesson)

    def admin_update_lesson(
        self, lesson_id: int, body: LessonUpdate
    ) -> LessonResponse | None:
        lesson = self.lessons.get(lesson_id)
        if lesson is None:
            return None
        updates = body.model_dump(exclude_unset=True)
        if "chapter_id" in updates and self.chapters.get(updates["chapter_id"]) is None:
            return None
        self.lessons.update(lesson, updates)
        self.db.commit()
        self.db.refresh(lesson)
        return self._lesson_response(lesson)

    def admin_delete_lesson(self, lesson_id: int) -> LessonResponse | None:
        lesson = self.lessons.get(lesson_id)
        if lesson is None:
            return None
        self.lessons.soft_delete(lesson)
        self.db.commit()
        self.db.refresh(lesson)
        return self._lesson_response(lesson)

