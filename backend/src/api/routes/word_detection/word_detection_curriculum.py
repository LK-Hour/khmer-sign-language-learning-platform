"""Word detection curriculum routes (learner-facing).

Admin content management lives in ``src.api.routes.admin.curriculum``
(centralized, multi-track: ``/api/admin/{track}/...``).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_db, get_optional_user
from src.models.user import User
from src.schemas.word_detection import (
    WdChapterResponse,
    WdLessonDetailResponse,
    WdLessonResponse,
    WdUnitResponse,
)
from src.services.word_detection.word_detection_curriculum_service import (
    WordDetectionCurriculumService,
)
from src.services.word_detection.word_detection_locking_service import (
    WordDetectionLockingService,
)
from src.services.word_detection.word_detection_progress_service import (
    WordDetectionProgressService,
)

from .word_detection_shared import lesson_detail_to_response, to_wd_lesson

router = APIRouter(prefix="/api/word_detection", tags=["word-detection"])


# ── Learner: Units ────────────────────────────────────────────────────────────

@router.get("/units", response_model=list[WdUnitResponse])
def list_units(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[WdUnitResponse]:
    curriculum = WordDetectionCurriculumService(db)
    progress = WordDetectionProgressService(db)
    locking = WordDetectionLockingService(db)
    user_id = user.id if user else None
    result: list[WdUnitResponse] = []
    for unit in curriculum.list_units():
        lesson_ids = curriculum.curriculum.list_lesson_ids_for_unit(unit.id)
        completed = progress.progress.count_completed_lessons(user_id, lesson_ids) if user_id else 0
        result.append(
            WdUnitResponse(
                id=unit.id,
                title=unit.name_en,
                titleKh=unit.name_kh,
                category=None,
                categoryKh=None,
                orderIndex=unit.order_index,
                chapterCount=curriculum.count_chapters(unit.id),
                completedLessonCount=completed,
                totalLessonCount=len(lesson_ids),
                isLocked=locking.is_unit_locked(unit.id, user_id),
            )
        )
    return result


@router.get("/units/{unit_id}", response_model=WdUnitResponse)
def get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> WdUnitResponse:
    curriculum = WordDetectionCurriculumService(db)
    unit = curriculum.get_unit(unit_id)
    if unit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    user_id = user.id if user else None
    locking = WordDetectionLockingService(db)
    progress = WordDetectionProgressService(db)
    lesson_ids = curriculum.curriculum.list_lesson_ids_for_unit(unit.id)
    completed = progress.progress.count_completed_lessons(user_id, lesson_ids) if user_id else 0
    return WdUnitResponse(
        id=unit.id,
        title=unit.name_en,
        titleKh=unit.name_kh,
        orderIndex=unit.order_index,
        chapterCount=curriculum.count_chapters(unit.id),
        completedLessonCount=completed,
        totalLessonCount=len(lesson_ids),
        isLocked=locking.is_unit_locked(unit.id, user_id),
    )


# ── Learner: Chapters ─────────────────────────────────────────────────────────

@router.get("/units/{unit_id}/chapters", response_model=list[WdChapterResponse])
def list_chapters(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[WdChapterResponse]:
    curriculum = WordDetectionCurriculumService(db)
    chapters = curriculum.list_chapters_for_unit(unit_id)
    if chapters is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    user_id = user.id if user else None
    progress_svc = WordDetectionProgressService(db)
    locking = WordDetectionLockingService(db)
    result: list[WdChapterResponse] = []
    for chapter in chapters:
        lesson_ids = curriculum.curriculum.list_lesson_ids_for_chapter(chapter.id)
        completed = (
            progress_svc.progress.count_completed_lessons(user_id, lesson_ids)
            if user_id
            else 0
        )
        result.append(
            WdChapterResponse(
                id=chapter.id,
                unitId=chapter.unit_id,
                title=chapter.name_en,
                titleKh=chapter.name_kh,
                description=chapter.description_en,
                descriptionKh=chapter.description_kh,
                orderIndex=chapter.order_index,
                level=chapter.level,
                lessonCount=len(lesson_ids),
                completedLessonCount=completed,
                isLocked=locking.is_chapter_locked(chapter.id, user_id),
            )
        )
    return result


@router.get("/chapters/{chapter_id}", response_model=WdChapterResponse)
def get_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> WdChapterResponse:
    curriculum = WordDetectionCurriculumService(db)
    chapter = curriculum.get_chapter(chapter_id)
    if chapter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    user_id = user.id if user else None
    locking = WordDetectionLockingService(db)
    progress_svc = WordDetectionProgressService(db)
    lesson_ids = curriculum.curriculum.list_lesson_ids_for_chapter(chapter.id)
    completed = (
        progress_svc.progress.count_completed_lessons(user_id, lesson_ids) if user_id else 0
    )
    return WdChapterResponse(
        id=chapter.id,
        unitId=chapter.unit_id,
        title=chapter.name_en,
        titleKh=chapter.name_kh,
        description=chapter.description_en,
        descriptionKh=chapter.description_kh,
        orderIndex=chapter.order_index,
        level=chapter.level,
        lessonCount=len(lesson_ids),
        completedLessonCount=completed,
        isLocked=locking.is_chapter_locked(chapter.id, user_id),
    )


# ── Learner: Lessons ──────────────────────────────────────────────────────────

@router.get("/chapters/{chapter_id}/lessons", response_model=list[WdLessonResponse])
def list_lessons(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[WdLessonResponse]:
    curriculum = WordDetectionCurriculumService(db)
    lessons = curriculum.list_lessons_for_chapter(chapter_id)
    if lessons is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    user_id = user.id if user else None
    progress = WordDetectionProgressService(db)
    result: list[WdLessonResponse] = []
    for lesson in lessons:
        word = curriculum.curriculum.get_primary_word_for_lesson(lesson.id)
        medias = curriculum.curriculum.list_medias_for_word(word.id) if word else []
        result.append(
            to_wd_lesson(
                lesson=lesson,
                chapter_id=chapter_id,
                word_kh=word.word_kh if word else lesson.name_kh,
                word_en=word.word_en if word else lesson.name_en,
                order_index=lesson.order_index,
                user_id=user_id,
                progress=progress,
                medias=medias,
            )
        )
    return result


@router.get("/lessons/{lesson_id}", response_model=WdLessonDetailResponse)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> WdLessonDetailResponse:
    curriculum = WordDetectionCurriculumService(db)
    bundle = curriculum.get_lesson_detail(lesson_id)
    if bundle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    user_id = user.id if user else None
    return lesson_detail_to_response(bundle, user_id, WordDetectionProgressService(db))
