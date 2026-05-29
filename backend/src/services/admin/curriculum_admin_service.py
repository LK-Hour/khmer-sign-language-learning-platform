"""Generic admin business logic for the curriculum hierarchy.

One implementation serves every learning track. The concrete ORM models are
resolved from the :class:`TrackConfig`, so Finger Spelling and Word Sign share
the exact same create/read/update/soft-delete logic.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from src.repositories.admin.base_crud_repository import BaseCrudRepository
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
from src.services.admin.track_registry import TrackConfig, get_track_config


class CurriculumAdminService:
    def __init__(self, db: Session, track: str) -> None:
        self.db = db
        self.cfg: TrackConfig = get_track_config(track)
        self.units = BaseCrudRepository(db, self.cfg.unit_model)
        self.chapters = BaseCrudRepository(db, self.cfg.chapter_model)
        self.lessons = BaseCrudRepository(db, self.cfg.lesson_model)
        self.exercises = BaseCrudRepository(db, self.cfg.exercise_model)

    # ── response builders ────────────────────────────────────────────────

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

    def list_units(self, *, active_only: bool = False) -> list[UnitResponse]:
        rows = self.units.list(
            active_only=active_only,
            order_by=[self.cfg.unit_model.order_index],
        )
        return [self._unit_response(u) for u in rows]

    def get_unit(self, unit_id: int) -> UnitResponse | None:
        unit = self.units.get(unit_id)
        return self._unit_response(unit) if unit else None

    def create_unit(self, body: UnitCreate) -> UnitResponse:
        unit = self.units.create(**body.model_dump())
        self.db.commit()
        self.db.refresh(unit)
        return self._unit_response(unit)

    def update_unit(self, unit_id: int, body: UnitUpdate) -> UnitResponse | None:
        unit = self.units.get(unit_id)
        if unit is None:
            return None
        self.units.update(unit, body.model_dump(exclude_unset=True))
        self.db.commit()
        self.db.refresh(unit)
        return self._unit_response(unit)

    def soft_delete_unit(self, unit_id: int) -> UnitResponse | None:
        unit = self.units.get(unit_id)
        if unit is None:
            return None
        self.units.soft_delete(unit)
        self.db.commit()
        self.db.refresh(unit)
        return self._unit_response(unit)

    # ── Chapters ─────────────────────────────────────────────────────────

    def list_chapters(
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

    def get_chapter(self, chapter_id: int) -> ChapterResponse | None:
        chapter = self.chapters.get(chapter_id)
        return self._chapter_response(chapter) if chapter else None

    def create_chapter(self, body: ChapterCreate) -> ChapterResponse | None:
        if self.units.get(body.unit_id) is None:
            return None
        chapter = self.chapters.create(**body.model_dump())
        self.db.commit()
        self.db.refresh(chapter)
        return self._chapter_response(chapter)

    def update_chapter(
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

    def soft_delete_chapter(self, chapter_id: int) -> ChapterResponse | None:
        chapter = self.chapters.get(chapter_id)
        if chapter is None:
            return None
        self.chapters.soft_delete(chapter)
        self.db.commit()
        self.db.refresh(chapter)
        return self._chapter_response(chapter)

    # ── Lessons ──────────────────────────────────────────────────────────

    def list_lessons(
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

    def get_lesson(self, lesson_id: int) -> LessonResponse | None:
        lesson = self.lessons.get(lesson_id)
        return self._lesson_response(lesson) if lesson else None

    def create_lesson(self, body: LessonCreate) -> LessonResponse | None:
        if self.chapters.get(body.chapter_id) is None:
            return None
        lesson = self.lessons.create(**body.model_dump())
        self.db.commit()
        self.db.refresh(lesson)
        return self._lesson_response(lesson)

    def update_lesson(
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

    def soft_delete_lesson(self, lesson_id: int) -> LessonResponse | None:
        lesson = self.lessons.get(lesson_id)
        if lesson is None:
            return None
        self.lessons.soft_delete(lesson)
        self.db.commit()
        self.db.refresh(lesson)
        return self._lesson_response(lesson)
