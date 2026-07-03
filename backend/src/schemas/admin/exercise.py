"""Track-agnostic admin schemas for exercises and their options.

The ``exercise_type`` is validated per-track in the service layer against that
track's exercise-type enum (e.g. Finger Spelling supports ``image_select`` while
Word Sign supports ``video_select``). Soft delete uses the ``is_active`` flag.
"""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

from ..media import MediaResponse


# ── Exercise options ─────────────────────────────────────────────────────────

class ExerciseOptionCreate(BaseModel):
    option_text_en: str | None = None
    option_text_kh: str | None = None
    media_id: int | None = None
    is_correct: bool = False
    is_active: bool = True
    points: int = 1
    order_index: int = 0


class ExerciseOptionUpdate(BaseModel):
    option_text_en: str | None = None
    option_text_kh: str | None = None
    media_id: int | None = None
    is_correct: bool | None = None
    is_active: bool | None = None
    points: int | None = None
    order_index: int | None = None


class ExerciseOptionResponse(BaseModel):
    id: int
    exercise_id: int
    option_text_en: str | None = None
    option_text_kh: str | None = None
    media_id: int | None = None
    is_correct: bool
    is_active: bool
    points: int
    order_index: int
    created_at: datetime | None = None
    media: MediaResponse | None = None

    model_config = {"from_attributes": True}


# ── Exercises ────────────────────────────────────────────────────────────────

class ExerciseCreate(BaseModel):
    lesson_id: int
    question_en: str
    question_kh: str
    exercise_type: str
    media_id: int | None = None
    correct_answer: str | None = None
    explanation_en: str | None = None
    explanation_kh: str | None = None
    order_index: int = 0
    is_active: bool = True
    options: List[ExerciseOptionCreate] = Field(default_factory=list)


class ExerciseUpdate(BaseModel):
    lesson_id: int | None = None
    question_en: str | None = None
    question_kh: str | None = None
    exercise_type: str | None = None
    media_id: int | None = None
    correct_answer: str | None = None
    explanation_en: str | None = None
    explanation_kh: str | None = None
    order_index: int | None = None
    is_active: bool | None = None


class ExerciseResponse(BaseModel):
    id: int
    lesson_id: int
    question_en: str
    question_kh: str
    exercise_type: str
    media_id: int | None = None
    correct_answer: str | None = None
    explanation_en: str | None = None
    explanation_kh: str | None = None
    order_index: int
    is_active: bool
    publish_status: str = "published"
    published_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    options: List[ExerciseOptionResponse] = []
    media: MediaResponse | None = None

    model_config = {"from_attributes": True}
