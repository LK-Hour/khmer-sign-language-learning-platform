"""Pydantic schemas for the Word Detection track.

Frontend-facing shapes use camelCase field names aligned to
frontend/src/features/word-detection/types/curriculum.ts.
Admin shapes use snake_case and are WD-specific so that
`level` is never added to the shared admin/curriculum.py
(which would break the Finger Spelling admin endpoints).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from .media import MediaResponse


# ── Internal / admin base schemas (snake_case) ────────────────────────────────

class WdUnitBase(BaseModel):
    name_en: str
    name_kh: str
    description_en: Optional[str] = None
    description_kh: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class WdUnitAdminResponse(WdUnitBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    chapter_count: int = 0

    model_config = {"from_attributes": True}


class WdChapterBase(BaseModel):
    unit_id: int
    name_en: str
    name_kh: str
    description_en: Optional[str] = None
    description_kh: Optional[str] = None
    order_index: int = 0
    level: int = 0
    is_active: bool = True


class WdChapterAdminResponse(WdChapterBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    lesson_count: int = 0
    exercise_count: int = 0

    model_config = {"from_attributes": True}


class WdLessonBase(BaseModel):
    chapter_id: int
    name_en: str
    name_kh: str
    description_en: Optional[str] = None
    description_kh: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class WdLessonAdminResponse(WdLessonBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── WD-specific admin create/update schemas with level ───────────────────────

class WdChapterCreate(BaseModel):
    unit_id: int
    name_en: str
    name_kh: str
    description_en: str | None = None
    description_kh: str | None = None
    order_index: int = 0
    level: int = 0
    is_active: bool = True


class WdChapterUpdate(BaseModel):
    unit_id: int | None = None
    name_en: str | None = None
    name_kh: str | None = None
    description_en: str | None = None
    description_kh: str | None = None
    order_index: int | None = None
    level: int | None = None
    is_active: bool | None = None


# ── Frontend-aligned API shapes (/api/word_detection/*) ──────────────────────

class WdUnitResponse(BaseModel):
    """Mirrors WdUnit in the frontend curriculum types."""
    id: int
    title: str
    titleKh: str
    category: str | None = None
    categoryKh: str | None = None
    orderIndex: int
    chapterCount: int
    completedLessonCount: int
    totalLessonCount: int
    isLocked: bool = False


class WdChapterResponse(BaseModel):
    """Mirrors WdChapter in the frontend curriculum types. Includes level."""
    id: int
    unitId: int
    title: str
    titleKh: str
    description: str | None = None
    descriptionKh: str | None = None
    orderIndex: int
    level: int
    lessonCount: int
    completedLessonCount: int
    isLocked: bool = False


class WdLessonResponse(BaseModel):
    """Mirrors WdLesson in the frontend curriculum types."""
    id: int
    chapterId: int
    word: str
    wordEn: str | None = None
    videoUrl: str
    orderIndex: int
    isLocked: bool
    progressStatus: str
    progressPercent: int = 0


class WdLessonDetailResponse(WdLessonResponse):
    """Mirrors WdLessonDetail — extends WdLessonResponse with descriptions."""
    description: str | None = None
    descriptionKh: str | None = None


# ── Exercise schemas ──────────────────────────────────────────────────────────

class WdExerciseOptionResponse(BaseModel):
    id: int
    option_text_en: str | None = None
    option_text_kh: str | None = None
    media_id: int | None = None
    order_index: int
    media: MediaResponse | None = None

    model_config = {"from_attributes": True}


class WdExerciseResponse(BaseModel):
    id: int
    lesson_id: int
    question_en: str
    question_kh: str
    exercise_type: str
    media_id: int | None = None
    order_index: int
    options: List[WdExerciseOptionResponse] = []
    media: MediaResponse | None = None

    model_config = {"from_attributes": True}


class WdExerciseSubmitRequest(BaseModel):
    selected_option_id: int | None = None
    selected_answer: str | None = None
    time_taken: int = 0


class WdExerciseSubmitResponse(BaseModel):
    is_correct: bool
    attempt_number: int
    lesson_id: int
    progress_id: uuid.UUID
    explanation_en: str | None = None
    explanation_kh: str | None = None


# ── Practice schemas ──────────────────────────────────────────────────────────

class WdPracticeAttemptRequest(BaseModel):
    accuracy: float | None = None


class WdPracticeAttemptResponse(BaseModel):
    lesson_id: int
    accuracy: float | None = None
    lesson_completed: bool


class WordPredictFeaturesRequest(BaseModel):
    features: list[float]
    target_label: str | None = None


class WordPredictResponse(BaseModel):
    match_confidence: float
    predicted_class_index: int
    predicted_label: str | None = None
    probabilities: list[float]
    target_label: str | None = None
    label_matches: bool | None = None


class WordPredictStatusResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    available: bool
    model_loaded: bool = False
    label_map_loaded: bool = False
    label_count: int = 0
    output_class_count: int | None = None
    input_feature_count: int | None = None
    label_map_matches_model: bool = False


# ── Progress schemas ──────────────────────────────────────────────────────────

class WdLessonProgressResponse(BaseModel):
    lessonId: int
    progressStatus: str
    isLocked: bool
    attemptCount: int
    lastPracticedAt: datetime | None = None
    completedAt: datetime | None = None


class WdChapterLessonProgressItem(BaseModel):
    lessonId: int
    orderIndex: int
    progressStatus: str
    isLocked: bool


class WdChapterProgressResponse(BaseModel):
    chapterId: int
    completedLessonCount: int
    totalLessonCount: int
    lessons: List[WdChapterLessonProgressItem] = []
