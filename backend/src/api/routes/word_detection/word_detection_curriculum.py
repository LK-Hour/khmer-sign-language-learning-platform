"""Word detection curriculum routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.deps import get_db, get_current_user, get_optional_user
from src.models.user import User
from src.schemas.admin.curriculum import (
    LessonCreate,
    LessonResponse,
    LessonUpdate,
    UnitCreate,
    UnitResponse,
    UnitUpdate,
)
from src.schemas.word_detection import (
    WdChapterAdminResponse,
    WdChapterCreate,
    WdChapterResponse,
    WdChapterUpdate,
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


# ── Admin: Units ──────────────────────────────────────────────────────────────

@router.get("/admin/units", response_model=list[UnitResponse])
def admin_list_units(
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return WordDetectionCurriculumService(db).admin_list_units(active_only=active_only)


@router.post("/admin/units", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
def admin_create_unit(
    body: UnitCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return WordDetectionCurriculumService(db).admin_create_unit(body)


@router.get("/admin/units/{unit_id}", response_model=UnitResponse)
def admin_get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = WordDetectionCurriculumService(db).admin_get_unit(unit_id)
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
    result = WordDetectionCurriculumService(db).admin_update_unit(unit_id, body)
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
    result = WordDetectionCurriculumService(db).admin_delete_unit(unit_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    return result


# ── Admin: Chapters (WD-specific, includes level) ─────────────────────────────

@router.get("/admin/chapters", response_model=list[WdChapterAdminResponse])
def admin_list_chapters(
    unit_id: int | None = Query(None),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return WordDetectionCurriculumService(db).admin_list_chapters(
        unit_id=unit_id, active_only=active_only
    )


@router.post(
    "/admin/chapters", response_model=WdChapterAdminResponse, status_code=status.HTTP_201_CREATED
)
def admin_create_chapter(
    body: WdChapterCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = WordDetectionCurriculumService(db).admin_create_chapter(body)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent unit not found")
    return result


@router.get("/admin/chapters/{chapter_id}", response_model=WdChapterAdminResponse)
def admin_get_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = WordDetectionCurriculumService(db).admin_get_chapter(chapter_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return result


@router.put("/admin/chapters/{chapter_id}", response_model=WdChapterAdminResponse)
def admin_update_chapter(
    chapter_id: int,
    body: WdChapterUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = WordDetectionCurriculumService(db).admin_update_chapter(chapter_id, body)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return result


@router.delete("/admin/chapters/{chapter_id}", response_model=WdChapterAdminResponse)
def admin_delete_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = WordDetectionCurriculumService(db).admin_delete_chapter(chapter_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return result


# ── Admin: Lessons ────────────────────────────────────────────────────────────

@router.get("/admin/lessons", response_model=list[LessonResponse])
def admin_list_lessons(
    chapter_id: int | None = Query(None),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return WordDetectionCurriculumService(db).admin_list_lessons(
        chapter_id=chapter_id, active_only=active_only
    )


@router.post(
    "/admin/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED
)
def admin_create_lesson(
    body: LessonCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.account_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = WordDetectionCurriculumService(db).admin_create_lesson(body)
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
    result = WordDetectionCurriculumService(db).admin_get_lesson(lesson_id)
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
    result = WordDetectionCurriculumService(db).admin_update_lesson(lesson_id, body)
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
    result = WordDetectionCurriculumService(db).admin_delete_lesson(lesson_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return result
