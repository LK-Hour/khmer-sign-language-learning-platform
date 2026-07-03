"""Generic admin business logic for the curriculum hierarchy.

One implementation serves every learning track. The concrete ORM models are
resolved from the :class:`TrackConfig`, so Finger Spelling and Word Detection
share the exact same create/read/update/soft-delete/restore/publish logic.

Content lifecycle (single admin role, confirm-publish workflow):
- ``create`` and ``update`` always leave the row in ``draft`` state, which is
  hidden from learner-facing APIs.
- ``publish`` is an explicit confirm action that makes the row learner-visible.
- ``delete`` soft-deletes (``is_active=False``); ``restore`` reactivates.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models.publishable import PUBLISH_STATUS_DRAFT, PUBLISH_STATUS_PUBLISHED, is_live
from src.repositories.base.base_crud_repository import BaseCrudRepository
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
from src.services.registry.track_registry import TrackConfig, get_track_config


def _model_fields(model, data: dict[str, Any]) -> dict[str, Any]:
    """Drop keys the target model does not have (e.g. ``level`` on tracks
    without a chapter level column)."""
    return {key: value for key, value in data.items() if hasattr(model, key)}


class CurriculumAdminService:
    def __init__(self, db: Session, track: str) -> None:
        self.db = db
        self.cfg: TrackConfig = get_track_config(track)
        self.units = BaseCrudRepository(db, self.cfg.unit_model)
        self.chapters = BaseCrudRepository(db, self.cfg.chapter_model)
        self.lessons = BaseCrudRepository(db, self.cfg.lesson_model)
        self.exercises = BaseCrudRepository(db, self.cfg.exercise_model)

    # ── shared helpers ───────────────────────────────────────────────────

    @staticmethod
    def _as_draft(data: dict[str, Any]) -> dict[str, Any]:
        data["publish_status"] = PUBLISH_STATUS_DRAFT
        return data

    def _mark_published(self, entity, actor_id: uuid.UUID | None) -> None:
        entity.publish_status = PUBLISH_STATUS_PUBLISHED
        entity.published_at = datetime.now()
        entity.published_by = actor_id
        self.db.commit()
        self.db.refresh(entity)

    @staticmethod
    def _filter_rows(rows, *, status: str | None = None, q: str | None = None):
        if status:
            rows = [r for r in rows if r.publish_status == status]
        if q:
            needle = q.strip().lower()
            rows = [
                r
                for r in rows
                if needle in (r.name_en or "").lower() or needle in (r.name_kh or "").lower()
            ]
        return rows

    # ── response builders ────────────────────────────────────────────────

    def _unit_response(self, unit) -> UnitResponse:
        data = UnitResponse.model_validate(unit)
        data.chapter_count = self.chapters.count(unit_id=unit.id)
        return data

    def _chapter_response(self, chapter) -> ChapterResponse:
        data = ChapterResponse.model_validate(chapter)
        data.lesson_count = self.lessons.count(chapter_id=chapter.id)
        lesson_model = self.cfg.lesson_model
        exercise_model = self.cfg.exercise_model
        stmt = (
            select(func.count())
            .select_from(exercise_model)
            .join(lesson_model, exercise_model.lesson_id == lesson_model.id)
            .where(lesson_model.chapter_id == chapter.id)
        )
        data.exercise_count = int(self.db.scalar(stmt) or 0)
        return data

    def _lesson_response(self, lesson) -> LessonResponse:
        data = LessonResponse.model_validate(lesson)
        data.exercise_count = self.exercises.count(lesson_id=lesson.id)
        return data

    # ── Units ────────────────────────────────────────────────────────────

    def list_units(
        self,
        *,
        active_only: bool = False,
        status: str | None = None,
        q: str | None = None,
    ) -> list[UnitResponse]:
        rows = self.units.list(
            active_only=active_only,
            order_by=[self.cfg.unit_model.order_index],
        )
        rows = self._filter_rows(rows, status=status, q=q)
        return [self._unit_response(u) for u in rows]

    def get_unit(self, unit_id: int) -> UnitResponse | None:
        unit = self.units.get(unit_id)
        return self._unit_response(unit) if unit else None

    def create_unit(self, body: UnitCreate) -> UnitResponse:
        data = self._as_draft(body.model_dump())
        unit = self.units.create(**_model_fields(self.cfg.unit_model, data))
        self.db.commit()
        self.db.refresh(unit)
        return self._unit_response(unit)

    def update_unit(self, unit_id: int, body: UnitUpdate) -> UnitResponse | None:
        unit = self.units.get(unit_id)
        if unit is None:
            return None
        updates = self._as_draft(body.model_dump(exclude_unset=True))
        self.units.update(unit, _model_fields(self.cfg.unit_model, updates))
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

    def restore_unit(self, unit_id: int) -> UnitResponse | None:
        unit = self.units.get(unit_id)
        if unit is None:
            return None
        unit.is_active = True
        self.db.commit()
        self.db.refresh(unit)
        return self._unit_response(unit)

    def publish_unit(self, unit_id: int, actor_id: uuid.UUID | None) -> UnitResponse | None:
        unit = self.units.get(unit_id)
        if unit is None:
            return None
        if not unit.is_active:
            raise ValueError("Cannot publish an inactive unit. Restore it first.")
        self._mark_published(unit, actor_id)
        return self._unit_response(unit)

    # ── Chapters ─────────────────────────────────────────────────────────

    def list_chapters(
        self,
        *,
        unit_id: int | None = None,
        active_only: bool = False,
        status: str | None = None,
        q: str | None = None,
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
        rows = self._filter_rows(rows, status=status, q=q)
        return [self._chapter_response(c) for c in rows]

    def get_chapter(self, chapter_id: int) -> ChapterResponse | None:
        chapter = self.chapters.get(chapter_id)
        return self._chapter_response(chapter) if chapter else None

    def create_chapter(self, body: ChapterCreate) -> ChapterResponse | None:
        if self.units.get(body.unit_id) is None:
            return None
        data = self._as_draft(body.model_dump(exclude_none=True))
        chapter = self.chapters.create(**_model_fields(self.cfg.chapter_model, data))
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
        updates = self._as_draft(updates)
        self.chapters.update(chapter, _model_fields(self.cfg.chapter_model, updates))
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

    def restore_chapter(self, chapter_id: int) -> ChapterResponse | None:
        chapter = self.chapters.get(chapter_id)
        if chapter is None:
            return None
        chapter.is_active = True
        self.db.commit()
        self.db.refresh(chapter)
        return self._chapter_response(chapter)

    def publish_chapter(
        self, chapter_id: int, actor_id: uuid.UUID | None
    ) -> ChapterResponse | None:
        chapter = self.chapters.get(chapter_id)
        if chapter is None:
            return None
        if not chapter.is_active:
            raise ValueError("Cannot publish an inactive chapter. Restore it first.")
        unit = self.units.get(chapter.unit_id)
        if unit is None or not is_live(unit):
            raise ValueError("Cannot publish this chapter: its parent unit is not published and active.")
        self._mark_published(chapter, actor_id)
        return self._chapter_response(chapter)

    # ── Lessons ──────────────────────────────────────────────────────────

    def list_lessons(
        self,
        *,
        chapter_id: int | None = None,
        active_only: bool = False,
        status: str | None = None,
        q: str | None = None,
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
        rows = self._filter_rows(rows, status=status, q=q)
        return [self._lesson_response(l) for l in rows]

    def get_lesson(self, lesson_id: int) -> LessonResponse | None:
        lesson = self.lessons.get(lesson_id)
        return self._lesson_response(lesson) if lesson else None

    def create_lesson(self, body: LessonCreate) -> LessonResponse | None:
        if self.chapters.get(body.chapter_id) is None:
            return None
        data = self._as_draft(body.model_dump())
        lesson = self.lessons.create(**_model_fields(self.cfg.lesson_model, data))
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
        updates = self._as_draft(updates)
        self.lessons.update(lesson, _model_fields(self.cfg.lesson_model, updates))
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

    def restore_lesson(self, lesson_id: int) -> LessonResponse | None:
        lesson = self.lessons.get(lesson_id)
        if lesson is None:
            return None
        lesson.is_active = True
        self.db.commit()
        self.db.refresh(lesson)
        return self._lesson_response(lesson)

    def publish_lesson(
        self, lesson_id: int, actor_id: uuid.UUID | None
    ) -> LessonResponse | None:
        lesson = self.lessons.get(lesson_id)
        if lesson is None:
            return None
        if not lesson.is_active:
            raise ValueError("Cannot publish an inactive lesson. Restore it first.")
        chapter = self.chapters.get(lesson.chapter_id)
        if chapter is None or not is_live(chapter):
            raise ValueError("Cannot publish this lesson: its parent chapter is not published and active.")
        self._mark_published(lesson, actor_id)
        return self._lesson_response(lesson)
