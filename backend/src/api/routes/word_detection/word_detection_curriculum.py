"""Word detection curriculum routes (learner-facing).

Admin content management lives in ``src.api.routes.admin.curriculum``
(centralized, multi-track: ``/api/admin/{track}/...``).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import redis as redis_lib

from src.api.deps import get_db, get_optional_user
from src.core.cache import cache_get, cache_set
from src.core.redis import get_redis
from src.models.user import User
from src.schemas.word_detection import (
    WdChapterResponse,
    WdLessonDetailResponse,
    WdLessonResponse,
    WdUnitResponse,
)
from src.services.word_detection.word_detection_chapter_practice_service import (
    WordDetectionChapterPracticeService,
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


# ── Aggregated tree (eliminates N+1 waterfall) ────────────────────────────────

@router.get("/tree")
def get_full_tree(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Return the FULL curriculum tree (units → chapters → lessons) in one response.

    Eliminates the N+1 waterfall of individual unit/chapter/lesson calls.
    Static structure is cached; per-user progress overlaid cheaply.
    """
    cache_key = "ksl:cache:public:wd:tree:structure"
    structure = cache_get(rc, cache_key)

    if structure is None:
        curriculum = WordDetectionCurriculumService(db)
        structure = []
        for unit in curriculum.list_units():
            chapters_data = []
            for chapter in (curriculum.list_chapters_for_unit(unit.id) or []):
                lessons_data = []
                for lesson in (curriculum.list_lessons_for_chapter(chapter.id) or []):
                    word = curriculum.curriculum.get_primary_word_for_lesson(lesson.id)
                    medias = curriculum.curriculum.list_medias_for_word(word.id) if word else []
                    lessons_data.append({
                        "id": lesson.id,
                        "chapter_id": chapter.id,
                        "name_kh": lesson.name_kh,
                        "name_en": lesson.name_en,
                        "order_index": lesson.order_index,
                        "word_kh": word.word_kh if word else lesson.name_kh,
                        "word_en": word.word_en if word else lesson.name_en,
                        "video_url": medias[0].file_url if medias else "/word-detection/placeholder-sign.svg",
                    })
                chapters_data.append({
                    "id": chapter.id,
                    "unit_id": chapter.unit_id,
                    "name_en": chapter.name_en,
                    "name_kh": chapter.name_kh,
                    "description_en": chapter.description_en,
                    "description_kh": chapter.description_kh,
                    "order_index": chapter.order_index,
                    "level": chapter.level,
                    "lesson_ids": [l["id"] for l in lessons_data],
                    "lessons": lessons_data,
                })
            structure.append({
                "id": unit.id,
                "name_en": unit.name_en,
                "name_kh": unit.name_kh,
                "order_index": unit.order_index,
                "chapters": chapters_data,
            })
        cache_set(rc, cache_key, structure, ttl=600)

    # Overlay per-user progress
    user_id = user.id if user else None
    progress = WordDetectionProgressService(db) if user_id else None
    locking = WordDetectionLockingService(db) if user_id else None
    practice_svc = WordDetectionChapterPracticeService(db) if user_id else None

    units_result = []
    for unit_s in structure:
        all_lesson_ids = []
        chapters_result = []
        for ch_s in unit_s["chapters"]:
            ch_lesson_ids = ch_s["lesson_ids"]
            all_lesson_ids.extend(ch_lesson_ids)
            ch_completed = progress.progress.count_completed_lessons(user_id, ch_lesson_ids) if progress else 0

            lessons_result = []
            for l_s in ch_s["lessons"]:
                lessons_result.append({
                    "id": l_s["id"],
                    "chapterId": l_s["chapter_id"],
                    "word": l_s["word_kh"],
                    "wordEn": l_s["word_en"],
                    "videoUrl": l_s["video_url"],
                    "orderIndex": l_s["order_index"],
                    "isLocked": progress.is_lesson_locked_by_id(user_id, l_s["id"]) if progress else False,
                    "progressStatus": progress.progress_status_for_lesson(user_id, l_s["id"]) if progress else "NOT_STARTED",
                })

            chapters_result.append({
                "id": ch_s["id"],
                "unitId": ch_s["unit_id"],
                "title": ch_s["name_en"],
                "titleKh": ch_s["name_kh"],
                "description": ch_s["description_en"],
                "descriptionKh": ch_s["description_kh"],
                "orderIndex": ch_s["order_index"],
                "level": ch_s["level"],
                "lessonCount": len(ch_lesson_ids),
                "completedLessonCount": ch_completed,
                "isLocked": locking.is_chapter_locked(ch_s["id"], user_id) if locking else False,
                "isPracticeUnlocked": practice_svc.is_practice_unlocked(user_id, ch_s["id"]) if practice_svc else False,
                "isPracticeComplete": practice_svc.is_practice_complete(user_id, ch_s["id"]) if practice_svc else False,
                "lessons": lessons_result,
            })

        units_result.append({
            "id": unit_s["id"],
            "title": unit_s["name_en"],
            "titleKh": unit_s["name_kh"],
            "orderIndex": unit_s["order_index"],
            "chapterCount": len(unit_s["chapters"]),
            "completedLessonCount": progress.progress.count_completed_lessons(user_id, all_lesson_ids) if progress else 0,
            "totalLessonCount": len(all_lesson_ids),
            "isLocked": locking.is_unit_locked(unit_s["id"], user_id) if locking else False,
            "chapters": chapters_result,
        })

    return units_result


# ── Learner: Units ────────────────────────────────────────────────────────────

@router.get("/units", response_model=list[WdUnitResponse])
def list_units(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    rc: redis_lib.Redis = Depends(get_redis),
) -> list[WdUnitResponse]:
    # Cache the expensive static structure for ALL users
    cache_key = "ksl:cache:public:wd:units:structure"
    structure = cache_get(rc, cache_key)

    if structure is None:
        curriculum = WordDetectionCurriculumService(db)
        structure = []
        for unit in curriculum.list_units():
            lesson_ids = curriculum.curriculum.list_lesson_ids_for_unit(unit.id)
            structure.append({
                "id": unit.id,
                "title": unit.name_en,
                "titleKh": unit.name_kh,
                "orderIndex": unit.order_index,
                "chapterCount": curriculum.count_chapters(unit.id),
                "totalLessonCount": len(lesson_ids),
                "lessonIds": lesson_ids,
            })
        cache_set(rc, cache_key, structure, ttl=600)

    # Overlay per-user fields (cheap)
    user_id = user.id if user else None
    progress = WordDetectionProgressService(db) if user_id else None
    locking = WordDetectionLockingService(db) if user_id else None

    result: list[WdUnitResponse] = []
    for s in structure:
        lesson_ids = s["lessonIds"]
        completed = progress.progress.count_completed_lessons(user_id, lesson_ids) if progress else 0
        result.append(
            WdUnitResponse(
                id=s["id"],
                title=s["title"],
                titleKh=s["titleKh"],
                category=None,
                categoryKh=None,
                orderIndex=s["orderIndex"],
                chapterCount=s["chapterCount"],
                completedLessonCount=completed,
                totalLessonCount=s["totalLessonCount"],
                isLocked=locking.is_unit_locked(s["id"], user_id) if locking else False,
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
    rc: redis_lib.Redis = Depends(get_redis),
) -> list[WdChapterResponse]:
    cache_key = f"ksl:cache:public:wd:chapters:{unit_id}"
    if user is None:
        cached = cache_get(rc, cache_key)
        if cached is not None:
            return [WdChapterResponse(**c) for c in cached]

    curriculum = WordDetectionCurriculumService(db)
    chapters = curriculum.list_chapters_for_unit(unit_id)
    if chapters is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    user_id = user.id if user else None
    progress_svc = WordDetectionProgressService(db)
    locking = WordDetectionLockingService(db)
    practice_svc = WordDetectionChapterPracticeService(db)
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
                isPracticeUnlocked=practice_svc.is_practice_unlocked(user_id, chapter.id),
                isPracticeComplete=practice_svc.is_practice_complete(user_id, chapter.id),
            )
        )

    if user is None:
        cache_set(rc, cache_key, [c.model_dump(mode="json") for c in result], ttl=600)
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
    practice_svc = WordDetectionChapterPracticeService(db)
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
        isPracticeUnlocked=practice_svc.is_practice_unlocked(user_id, chapter.id),
        isPracticeComplete=practice_svc.is_practice_complete(user_id, chapter.id),
    )


# ── Learner: Lessons ──────────────────────────────────────────────────────────

@router.get("/chapters/{chapter_id}/lessons", response_model=list[WdLessonResponse])
def list_lessons(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    rc: redis_lib.Redis = Depends(get_redis),
) -> list[WdLessonResponse]:
    cache_key = f"ksl:cache:public:wd:lessons:{chapter_id}"
    if user is None:
        cached = cache_get(rc, cache_key)
        if cached is not None:
            return [WdLessonResponse(**l) for l in cached]

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

    if user is None:
        cache_set(rc, cache_key, [l.model_dump(mode="json") for l in result], ttl=600)
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
