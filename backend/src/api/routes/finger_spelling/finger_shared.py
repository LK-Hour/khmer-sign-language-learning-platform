"""Shared response mappers for finger spelling routes."""

from __future__ import annotations

import random
import uuid

from src.models.media import Media
from src.schemas.finger_spelling import FsLessonDetailResponse, FsLessonResponse
from src.services.finger_spelling.finger_curriculum_service import LessonDetailBundle
from src.services.finger_spelling.finger_progress_service import FingerProgressService

_PLACEHOLDER_IMAGE = "/finger-spelling/placeholder-sign.svg"


def image_url(medias: list[Media]) -> str:
    """Return a random image URL from the available medias for variety."""
    if medias:
        return random.choice(medias).file_url
    return _PLACEHOLDER_IMAGE


def to_fs_lesson(
    *,
    lesson,
    chapter_id: int,
    letter_id: int,
    letter_kh: str,
    letter_en: str | None,
    medias: list[Media],
    order_index: int,
    user_id: uuid.UUID | None,
    progress: FingerProgressService,
) -> FsLessonResponse:
    return FsLessonResponse(
        id=lesson.id,
        chapterId=chapter_id,
        letterId=letter_id,
        letter=letter_kh,
        romanization=letter_en,
        letterNameEn=letter_en,
        letterNameKh=letter_kh,
        imageUrl=image_url(medias),
        orderIndex=order_index,
        isLocked=progress.is_lesson_locked_by_id(user_id, lesson.id),
        progressStatus=progress.progress_status_for_lesson(user_id, lesson.id),
    )


def lesson_detail_to_response(
    bundle: LessonDetailBundle,
    user_id: uuid.UUID | None,
    progress: FingerProgressService,
) -> FsLessonDetailResponse:
    primary = bundle.letters[0] if bundle.letters else None
    letter = primary.letter if primary else None
    medias = primary.medias if primary else []
    letter_kh = letter.letter_kh if letter else bundle.lesson.name_kh
    letter_en = letter.letter_en if letter else None

    base = to_fs_lesson(
        lesson=bundle.lesson,
        chapter_id=bundle.chapter.id,
        letter_id=letter.id if letter else 0,
        letter_kh=letter_kh,
        letter_en=letter_en,
        medias=medias,
        order_index=bundle.lesson.order_index,
        user_id=user_id,
        progress=progress,
    )
    return FsLessonDetailResponse(
        **base.model_dump(),
        description=bundle.lesson.description_en,
        descriptionKh=bundle.lesson.description_kh,
    )
