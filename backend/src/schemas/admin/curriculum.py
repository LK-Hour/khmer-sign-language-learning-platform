"""Track-agnostic admin schemas for the curriculum hierarchy.

Units, chapters, and lessons share an identical column layout between the
Finger Spelling and Word Sign tracks, so these schemas are reused for both.
Soft delete is expressed through the ``is_active`` flag rather than row removal.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


# ── Units ────────────────────────────────────────────────────────────────────

class UnitCreate(BaseModel):
    name_en: str
    name_kh: str
    description_en: str | None = None
    description_kh: str | None = None
    order_index: int = 0
    is_active: bool = True


class UnitUpdate(BaseModel):
    name_en: str | None = None
    name_kh: str | None = None
    description_en: str | None = None
    description_kh: str | None = None
    order_index: int | None = None
    is_active: bool | None = None


class UnitResponse(BaseModel):
    id: int
    name_en: str
    name_kh: str
    description_en: str | None = None
    description_kh: str | None = None
    order_index: int
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None
    chapter_count: int = 0

    model_config = {"from_attributes": True}


# ── Chapters ─────────────────────────────────────────────────────────────────

class ChapterCreate(BaseModel):
    unit_id: int
    name_en: str
    name_kh: str
    description_en: str | None = None
    description_kh: str | None = None
    order_index: int = 0
    is_active: bool = True


class ChapterUpdate(BaseModel):
    unit_id: int | None = None
    name_en: str | None = None
    name_kh: str | None = None
    description_en: str | None = None
    description_kh: str | None = None
    order_index: int | None = None
    is_active: bool | None = None


class ChapterResponse(BaseModel):
    id: int
    unit_id: int
    name_en: str
    name_kh: str
    description_en: str | None = None
    description_kh: str | None = None
    order_index: int
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None
    lesson_count: int = 0
    exercise_count: int = 0

    model_config = {"from_attributes": True}


# ── Lessons ──────────────────────────────────────────────────────────────────

class LessonCreate(BaseModel):
    chapter_id: int
    name_en: str
    name_kh: str
    description_en: str | None = None
    description_kh: str | None = None
    order_index: int = 0
    is_active: bool = True


class LessonUpdate(BaseModel):
    chapter_id: int | None = None
    name_en: str | None = None
    name_kh: str | None = None
    description_en: str | None = None
    description_kh: str | None = None
    order_index: int | None = None
    is_active: bool | None = None


class LessonResponse(BaseModel):
    id: int
    chapter_id: int
    name_en: str
    name_kh: str
    description_en: str | None = None
    description_kh: str | None = None
    order_index: int
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None
    exercise_count: int = 0

    model_config = {"from_attributes": True}
