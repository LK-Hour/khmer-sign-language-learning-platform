"""Shared response mappers for word detection routes."""

from __future__ import annotations

import uuid

from src.models.media import Media
from src.schemas.word_detection import WdLessonDetailResponse, WdLessonResponse
from src.services.word_detection.word_detection_curriculum_service import WdLessonDetailBundle
from src.services.word_detection.word_detection_progress_service import (
    WordDetectionProgressService,
)

_PLACEHOLDER_IMAGE = "/word-detection/placeholder-sign.svg"


def image_url(medias: list[Media]) -> str:
    if medias:
        return medias[0].file_url
    return _PLACEHOLDER_IMAGE


def to_wd_lesson(
    *,
    lesson,
    chapter_id: int,
    word_kh: str,
    word_en: str | None,
    order_index: int,
    user_id: uuid.UUID | None,
    progress: WordDetectionProgressService,
) -> WdLessonResponse:
    return WdLessonResponse(
        id=lesson.id,
        chapterId=chapter_id,
        word=word_kh,
        wordEn=word_en,
        orderIndex=order_index,
        isLocked=progress.is_lesson_locked_by_id(user_id, lesson.id),
        progressStatus=progress.progress_status_for_lesson(user_id, lesson.id),
    )


def lesson_detail_to_response(
    bundle: WdLessonDetailBundle,
    user_id: uuid.UUID | None,
    progress: WordDetectionProgressService,
) -> WdLessonDetailResponse:
    primary = bundle.words[0] if bundle.words else None
    word = primary.word if primary else None
    word_kh = word.word_kh if word else bundle.lesson.name_kh
    word_en = word.word_en if word else bundle.lesson.name_en

    base = to_wd_lesson(
        lesson=bundle.lesson,
        chapter_id=bundle.chapter.id,
        word_kh=word_kh,
        word_en=word_en,
        order_index=bundle.lesson.order_index,
        user_id=user_id,
        progress=progress,
    )
    return WdLessonDetailResponse(
        **base.model_dump(),
        description=bundle.lesson.description_en,
        descriptionKh=bundle.lesson.description_kh,
    )
