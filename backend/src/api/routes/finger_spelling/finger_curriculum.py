"""Finger spelling curriculum routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.api.deps import get_current_user, get_optional_user
from src.models.user import User
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
from src.schemas.finger_spelling import (
    FsChapterResponse,
    FsLessonDetailResponse,
    FsLessonResponse,
    FsUnitResponse,
)
from src.services.finger_spelling.finger_curriculum_service import FingerCurriculumService
from src.services.finger_spelling.finger_locking_service import FingerLockingService
from src.services.finger_spelling.finger_progress_service import FingerProgressService

from .finger_shared import lesson_detail_to_response, to_fs_lesson

router = APIRouter(prefix="/api/finger_spelling", tags=["finger-spelling"])


#API for Units
@router.get("/units", response_model=list[FsUnitResponse])
def list_units(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[FsUnitResponse]:
    curriculum = FingerCurriculumService(db)
    progress = FingerProgressService(db)
    locking = FingerLockingService(db)
    user_id = user.id if user else None
    result: list[FsUnitResponse] = []
    for unit in curriculum.list_units():
        lesson_ids = curriculum.curriculum.list_lesson_ids_for_unit(unit.id)
        completed = progress.progress.count_completed_lessons(user_id, lesson_ids) if user_id else 0
        result.append(
            FsUnitResponse(
                id=unit.id,
                title=unit.name_en,
                titleKh=unit.name_kh,
                category=None,
                orderIndex=unit.order_index,
                chapterCount=curriculum.count_chapters(unit.id),
                completedLessonCount=completed,
                totalLessonCount=len(lesson_ids),
                isLocked=locking.is_unit_locked(unit.id, user_id),
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
    lesson_ids = curriculum.curriculum.list_lesson_ids_for_unit(unit.id)
    completed = (
        FingerProgressService(db).progress.count_completed_lessons(user_id, lesson_ids) if user_id else 0
    )
    return FsUnitResponse(
        id=unit.id,
        title=unit.name_en,
        titleKh=unit.name_kh,
        orderIndex=unit.order_index,
        chapterCount=curriculum.count_chapters(unit.id),
        completedLessonCount=completed,
        totalLessonCount=len(lesson_ids),
        isLocked=locking.is_unit_locked(unit.id, user_id),
    )


@router.get("/units/{unit_id}/chapters", response_model=list[FsChapterResponse])
def list_chapters(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[FsChapterResponse]:
    curriculum = FingerCurriculumService(db)
    chapters = curriculum.list_chapters_for_unit(unit_id)
    if chapters is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    user_id = user.id if user else None
    progress_svc = FingerProgressService(db)
    locking = FingerLockingService(db)
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
                isLocked=locking.is_chapter_locked(chapter.id, user_id),
            )
        )
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
        isLocked=locking.is_chapter_locked(chapter.id, user_id),
    )


@router.get("/chapters/{chapter_id}/lessons", response_model=list[FsLessonResponse])
def list_lessons(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[FsLessonResponse]:
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
                letter_kh=letter.letter_kh if letter else lesson.name_kh,
                letter_en=letter.letter_en if letter else None,
                medias=medias,
                order_index=lesson.order_index,
                user_id=user_id,
                progress=progress,
            )
        )
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


# ────────────────────────────────────────────────────────────────────────
# ADMIN CRUD OPERATIONS (requires account_type=admin)
# ────────────────────────────────────────────────────────────────────────

# ── Admin Units ──────────────────────────────────────────────────────────


@router.get("/admin/units", response_model=list[UnitResponse])
def admin_list_units(
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return FingerCurriculumService(db).admin_list_units(active_only=active_only)


@router.post("/admin/units", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
def admin_create_unit(
    body: UnitCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return FingerCurriculumService(db).admin_create_unit(body)


@router.get("/admin/units/{unit_id}", response_model=UnitResponse)
def admin_get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = FingerCurriculumService(db).admin_get_unit(unit_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    return result


@router.put("/admin/units/{unit_id}", response_model=UnitResponse)
def admin_update_unit(
    unit_id: int,
    body: UnitUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = FingerCurriculumService(db).admin_update_unit(unit_id, body)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    return result


@router.delete("/admin/units/{unit_id}", response_model=UnitResponse)
def admin_delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = FingerCurriculumService(db).admin_delete_unit(unit_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    return result


# ── Admin Chapters ───────────────────────────────────────────────────────


@router.get("/admin/chapters", response_model=list[ChapterResponse])
def admin_list_chapters(
    unit_id: int | None = Query(None),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return FingerCurriculumService(db).admin_list_chapters(unit_id=unit_id, active_only=active_only)


@router.post("/admin/chapters", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
def admin_create_chapter(
    body: ChapterCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = FingerCurriculumService(db).admin_create_chapter(body)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent unit not found")
    return result


@router.get("/admin/chapters/{chapter_id}", response_model=ChapterResponse)
def admin_get_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = FingerCurriculumService(db).admin_get_chapter(chapter_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return result


@router.put("/admin/chapters/{chapter_id}", response_model=ChapterResponse)
def admin_update_chapter(
    chapter_id: int,
    body: ChapterUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = FingerCurriculumService(db).admin_update_chapter(chapter_id, body)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return result


@router.delete("/admin/chapters/{chapter_id}", response_model=ChapterResponse)
def admin_delete_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = FingerCurriculumService(db).admin_delete_chapter(chapter_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return result


# ── Admin Lessons ────────────────────────────────────────────────────────


@router.get("/admin/lessons", response_model=list[LessonResponse])
def admin_list_lessons(
    chapter_id: int | None = Query(None),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return FingerCurriculumService(db).admin_list_lessons(chapter_id=chapter_id, active_only=active_only)


@router.post("/admin/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def admin_create_lesson(
    body: LessonCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = FingerCurriculumService(db).admin_create_lesson(body)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent chapter not found")
    return result


@router.get("/admin/lessons/{lesson_id}", response_model=LessonResponse)
def admin_get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = FingerCurriculumService(db).admin_get_lesson(lesson_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return result


@router.put("/admin/lessons/{lesson_id}", response_model=LessonResponse)
def admin_update_lesson(
    lesson_id: int,
    body: LessonUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = FingerCurriculumService(db).admin_update_lesson(lesson_id, body)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return result


@router.delete("/admin/lessons/{lesson_id}", response_model=LessonResponse)
def admin_delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = FingerCurriculumService(db).admin_delete_lesson(lesson_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return result

