"""Finger spelling curriculum routes (learner-facing).

Admin content management lives in ``src.api.routes.admin.curriculum``
(centralized, multi-track: ``/api/admin/{track}/...``).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import redis as redis_lib

from src.api.deps import get_db
from src.api.deps import get_optional_user
from src.core.cache import cache_get, cache_set
from src.core.redis import get_redis
from src.models.user import User
from src.schemas.finger_spelling import (
    FsChapterResponse,
    FsLessonDetailResponse,
    FsLessonResponse,
    FsUnitResponse,
)
from src.services.finger_spelling.finger_chapter_practice_service import FingerChapterPracticeService
from src.services.finger_spelling.finger_curriculum_service import FingerCurriculumService
from src.services.finger_spelling.finger_locking_service import FingerLockingService
from src.services.finger_spelling.finger_progress_service import FingerProgressService
from src.services.finger_spelling.finger_exercise_attempt_service import FingerExerciseAttemptService

from .finger_shared import lesson_detail_to_response, to_fs_lesson

router = APIRouter(prefix="/api/finger_spelling", tags=["finger-spelling"])


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
    cache_key = "ksl:cache:public:fs:tree:structure"
    structure = cache_get(rc, cache_key)

    if structure is None:
        curriculum = FingerCurriculumService(db)
        structure = []
        for unit in curriculum.list_units():
            chapters_data = []
            for chapter in (curriculum.list_chapters_for_unit(unit.id) or []):
                lessons_data = []
                for lesson in (curriculum.list_lessons_for_chapter(chapter.id) or []):
                    letter = curriculum.curriculum.get_primary_letter_for_lesson(lesson.id)
                    medias = curriculum.curriculum.list_medias_for_letter(letter.id) if letter else []
                    lessons_data.append({
                        "id": lesson.id,
                        "chapter_id": chapter.id,
                        "name_en": lesson.name_en,
                        "name_kh": lesson.name_kh,
                        "order_index": lesson.order_index,
                        "letter_id": letter.id if letter else 0,
                        "letter_kh": letter.letter_kh if letter else lesson.name_kh,
                        "letter_en": letter.letter_en if letter else None,
                        "image_url": medias[0].file_url if medias else "/finger-spelling/placeholder-sign.svg",
                    })
                chapters_data.append({
                    "id": chapter.id,
                    "unit_id": chapter.unit_id,
                    "name_en": chapter.name_en,
                    "name_kh": chapter.name_kh,
                    "description_en": chapter.description_en,
                    "description_kh": chapter.description_kh,
                    "order_index": chapter.order_index,
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
    progress = FingerProgressService(db) if user_id else None
    locking = FingerLockingService(db) if user_id else None
    exercise_svc = FingerExerciseAttemptService(db) if user_id else None
    practice_svc = FingerChapterPracticeService(db) if user_id else None
    curriculum_svc = FingerCurriculumService(db)

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
                    "letterId": l_s["letter_id"],
                    "letter": l_s["letter_kh"],
                    "romanization": l_s["letter_en"],
                    "letterNameEn": l_s["letter_en"],
                    "letterNameKh": l_s["letter_kh"],
                    "imageUrl": l_s["image_url"],
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
                "lessonCount": len(ch_lesson_ids),
                "completedLessonCount": ch_completed,
                "isExerciseUnlocked": curriculum_svc.is_chapter_exercise_unlocked(user_id, ch_s["id"]),
                "isPracticeUnlocked": practice_svc.is_practice_unlocked(user_id, ch_s["id"]) if practice_svc else False,
                "isPracticeComplete": practice_svc.is_practice_complete(user_id, ch_s["id"]) if practice_svc else False,
                "isLocked": locking.is_chapter_locked(ch_s["id"], user_id) if locking else False,
                "lessons": lessons_result,
            })

        exercise_status = exercise_svc.get_unit_exercise_status(user_id, unit_s["id"]) if exercise_svc else {
            "isExerciseUnlocked": False, "isExerciseCompleted": False, "bestScore": 0, "maxScore": 0
        }
        units_result.append({
            "id": unit_s["id"],
            "title": unit_s["name_en"],
            "titleKh": unit_s["name_kh"],
            "orderIndex": unit_s["order_index"],
            "chapterCount": len(unit_s["chapters"]),
            "completedLessonCount": progress.progress.count_completed_lessons(user_id, all_lesson_ids) if progress else 0,
            "totalLessonCount": len(all_lesson_ids),
            "isLocked": locking.is_unit_locked(unit_s["id"], user_id) if locking else False,
            "isExerciseUnlocked": exercise_status["isExerciseUnlocked"],
            "isExerciseCompleted": exercise_status["isExerciseCompleted"],
            "bestScore": exercise_status["bestScore"],
            "maxScore": exercise_status["maxScore"],
            "chapters": chapters_result,
        })

    return units_result


#API for Units
@router.get("/units", response_model=list[FsUnitResponse])
def list_units(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    rc: redis_lib.Redis = Depends(get_redis),
) -> list[FsUnitResponse]:
    # Cache the expensive static structure (unit list + counts) for ALL users.
    # Per-user progress/locking is overlaid cheaply on top.
    cache_key = "ksl:cache:public:fs:units:structure"
    structure = cache_get(rc, cache_key)

    if structure is None:
        # EXPENSIVE: iterate units, count chapters/lessons for each
        curriculum = FingerCurriculumService(db)
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

    # CHEAP: overlay per-user fields
    user_id = user.id if user else None
    progress = FingerProgressService(db) if user_id else None
    locking = FingerLockingService(db) if user_id else None
    exercise_svc = FingerExerciseAttemptService(db) if user_id else None

    result: list[FsUnitResponse] = []
    for s in structure:
        lesson_ids = s["lessonIds"]
        completed = progress.progress.count_completed_lessons(user_id, lesson_ids) if progress else 0
        exercise_status = exercise_svc.get_unit_exercise_status(user_id, s["id"]) if exercise_svc else {
            "isExerciseUnlocked": False, "isExerciseCompleted": False, "bestScore": 0, "maxScore": 0
        }
        result.append(
            FsUnitResponse(
                id=s["id"],
                title=s["title"],
                titleKh=s["titleKh"],
                category=None,
                orderIndex=s["orderIndex"],
                chapterCount=s["chapterCount"],
                completedLessonCount=completed,
                totalLessonCount=s["totalLessonCount"],
                isLocked=locking.is_unit_locked(s["id"], user_id) if locking else False,
                isExerciseUnlocked=exercise_status["isExerciseUnlocked"],
                isExerciseCompleted=exercise_status["isExerciseCompleted"],
                bestScore=exercise_status["bestScore"],
                maxScore=exercise_status["maxScore"],
            )
        )
    return result


@router.get("/units/{unit_id}", response_model=FsUnitResponse)
def get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> FsUnitResponse:
    curriculum = FingerCurriculumService(db)
    unit = curriculum.get_unit(unit_id)
    if unit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    user_id = user.id if user else None
    locking = FingerLockingService(db)
    exercise_svc = FingerExerciseAttemptService(db)
    lesson_ids = curriculum.curriculum.list_lesson_ids_for_unit(unit.id)
    completed = (
        FingerProgressService(db).progress.count_completed_lessons(user_id, lesson_ids) if user_id else 0
    )
    exercise_status = exercise_svc.get_unit_exercise_status(user_id, unit_id)
    return FsUnitResponse(
        id=unit.id,
        title=unit.name_en,
        titleKh=unit.name_kh,
        orderIndex=unit.order_index,
        chapterCount=curriculum.count_chapters(unit.id),
        completedLessonCount=completed,
        totalLessonCount=len(lesson_ids),
        isLocked=locking.is_unit_locked(unit.id, user_id),
        isExerciseUnlocked=exercise_status["isExerciseUnlocked"],
        isExerciseCompleted=exercise_status["isExerciseCompleted"],
        bestScore=exercise_status["bestScore"],
        maxScore=exercise_status["maxScore"],
    )


@router.get("/units/{unit_id}/chapters", response_model=list[FsChapterResponse])
def list_chapters(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    rc: redis_lib.Redis = Depends(get_redis),
) -> list[FsChapterResponse]:
    cache_key = f"ksl:cache:public:fs:chapters:{unit_id}"
    if user is None:
        cached = cache_get(rc, cache_key)
        if cached is not None:
            return [FsChapterResponse(**c) for c in cached]

    curriculum = FingerCurriculumService(db)
    chapters = curriculum.list_chapters_for_unit(unit_id)
    if chapters is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    user_id = user.id if user else None
    progress_svc = FingerProgressService(db)
    locking = FingerLockingService(db)
    practice_svc = FingerChapterPracticeService(db)
    result: list[FsChapterResponse] = []
    for chapter in chapters:
        lesson_ids = curriculum.curriculum.list_lesson_ids_for_chapter(chapter.id)
        completed = progress_svc.progress.count_completed_lessons(user_id, lesson_ids) if user_id else 0
        result.append(
            FsChapterResponse(
                id=chapter.id,
                unitId=chapter.unit_id,
                title=chapter.name_en,
                titleKh=chapter.name_kh,
                description=chapter.description_en,
                descriptionKh=chapter.description_kh,
                orderIndex=chapter.order_index,
                lessonCount=len(lesson_ids),
                completedLessonCount=completed,
                isExerciseUnlocked=curriculum.is_chapter_exercise_unlocked(user_id, chapter.id),
                isPracticeUnlocked=practice_svc.is_practice_unlocked(user_id, chapter.id),
                isPracticeComplete=practice_svc.is_practice_complete(user_id, chapter.id),
                isLocked=locking.is_chapter_locked(chapter.id, user_id),
            )
        )

    if user is None:
        cache_set(rc, cache_key, [c.model_dump(mode="json") for c in result], ttl=600)
    return result

# API for Chapters
@router.get("/chapters/{chapter_id}", response_model=FsChapterResponse)
def get_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> FsChapterResponse:
    curriculum = FingerCurriculumService(db)
    chapter = curriculum.get_chapter(chapter_id)
    if chapter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    user_id = user.id if user else None
    locking = FingerLockingService(db)
    practice_svc = FingerChapterPracticeService(db)
    lesson_ids = curriculum.curriculum.list_lesson_ids_for_chapter(chapter.id)
    completed = (
        FingerProgressService(db).progress.count_completed_lessons(user_id, lesson_ids) if user_id else 0
    )
    return FsChapterResponse(
        id=chapter.id,
        unitId=chapter.unit_id,
        title=chapter.name_en,
        titleKh=chapter.name_kh,
        description=chapter.description_en,
        descriptionKh=chapter.description_kh,
        orderIndex=chapter.order_index,
        lessonCount=len(lesson_ids),
        completedLessonCount=completed,
        isExerciseUnlocked=curriculum.is_chapter_exercise_unlocked(user_id, chapter.id),
        isPracticeUnlocked=practice_svc.is_practice_unlocked(user_id, chapter.id),
        isPracticeComplete=practice_svc.is_practice_complete(user_id, chapter.id),
        isLocked=locking.is_chapter_locked(chapter.id, user_id),
    )


@router.get("/chapters/{chapter_id}/lessons", response_model=list[FsLessonResponse])
def list_lessons(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    rc: redis_lib.Redis = Depends(get_redis),
) -> list[FsLessonResponse]:
    cache_key = f"ksl:cache:public:fs:lessons:{chapter_id}"
    if user is None:
        cached = cache_get(rc, cache_key)
        if cached is not None:
            return [FsLessonResponse(**l) for l in cached]

    curriculum = FingerCurriculumService(db)
    lessons = curriculum.list_lessons_for_chapter(chapter_id)
    if lessons is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    user_id = user.id if user else None
    progress = FingerProgressService(db)
    result: list[FsLessonResponse] = []
    for lesson in lessons:
        letter = curriculum.curriculum.get_primary_letter_for_lesson(lesson.id)
        medias = curriculum.curriculum.list_medias_for_letter(letter.id) if letter else []
        result.append(
            to_fs_lesson(
                lesson=lesson,
                chapter_id=chapter_id,
                letter_id=letter.id if letter else 0,
                letter_kh=letter.letter_kh if letter else lesson.name_kh,
                letter_en=letter.letter_en if letter else None,
                medias=medias,
                order_index=lesson.order_index,
                user_id=user_id,
                progress=progress,
            )
        )

    if user is None:
        cache_set(rc, cache_key, [l.model_dump(mode="json") for l in result], ttl=600)
    return result

# API for Lessons
@router.get("/lessons/{lesson_id}", response_model=FsLessonDetailResponse)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> FsLessonDetailResponse:
    curriculum = FingerCurriculumService(db)
    bundle = curriculum.get_lesson_detail(lesson_id)
    if bundle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    user_id = user.id if user else None
    return lesson_detail_to_response(bundle, user_id, FingerProgressService(db))

