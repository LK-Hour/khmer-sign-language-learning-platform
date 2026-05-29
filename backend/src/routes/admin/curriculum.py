"""Admin curriculum routes (track-parameterized).

One router serves every learning track via the ``{track}`` path parameter
(e.g. ``finger``). Soft delete is exposed through ``DELETE`` (sets ``is_active``
to ``False``); restore by ``PUT`` with ``is_active=true``.

    /api/admin/{track}/units           GET  POST
    /api/admin/{track}/units/{id}      GET  PUT  DELETE
    /api/admin/{track}/chapters        GET  POST
    /api/admin/{track}/chapters/{id}   GET  PUT  DELETE
    /api/admin/{track}/lessons         GET  POST
    /api/admin/{track}/lessons/{id}    GET  PUT  DELETE
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.dependencies.auth import get_admin_user
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
from src.services.admin.curriculum_admin_service import CurriculumAdminService

router = APIRouter(
    prefix="/api/admin/{track}",
    tags=["admin-curriculum"],
    dependencies=[Depends(get_admin_user)],
)


def _svc(track: str, db: Session) -> CurriculumAdminService:
    return CurriculumAdminService(db, track)


# ── Units ────────────────────────────────────────────────────────────────────


@router.get("/units", response_model=list[UnitResponse])
def list_units(
    track: str,
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    return _svc(track, db).list_units(active_only=active_only)


@router.post("/units", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
def create_unit(track: str, body: UnitCreate, db: Session = Depends(get_db)):
    return _svc(track, db).create_unit(body)


@router.get("/units/{unit_id}", response_model=UnitResponse)
def get_unit(track: str, unit_id: int, db: Session = Depends(get_db)):
    result = _svc(track, db).get_unit(unit_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unit not found")
    return result


@router.put("/units/{unit_id}", response_model=UnitResponse)
def update_unit(
    track: str, unit_id: int, body: UnitUpdate, db: Session = Depends(get_db)
):
    result = _svc(track, db).update_unit(unit_id, body)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unit not found")
    return result


@router.delete("/units/{unit_id}", response_model=UnitResponse)
def soft_delete_unit(track: str, unit_id: int, db: Session = Depends(get_db)):
    result = _svc(track, db).soft_delete_unit(unit_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unit not found")
    return result


# ── Chapters ─────────────────────────────────────────────────────────────────


@router.get("/chapters", response_model=list[ChapterResponse])
def list_chapters(
    track: str,
    unit_id: int | None = Query(None),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    return _svc(track, db).list_chapters(unit_id=unit_id, active_only=active_only)


@router.post(
    "/chapters", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED
)
def create_chapter(track: str, body: ChapterCreate, db: Session = Depends(get_db)):
    result = _svc(track, db).create_chapter(body)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Parent unit not found")
    return result


@router.get("/chapters/{chapter_id}", response_model=ChapterResponse)
def get_chapter(track: str, chapter_id: int, db: Session = Depends(get_db)):
    result = _svc(track, db).get_chapter(chapter_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chapter not found")
    return result


@router.put("/chapters/{chapter_id}", response_model=ChapterResponse)
def update_chapter(
    track: str, chapter_id: int, body: ChapterUpdate, db: Session = Depends(get_db)
):
    result = _svc(track, db).update_chapter(chapter_id, body)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chapter not found")
    return result


@router.delete("/chapters/{chapter_id}", response_model=ChapterResponse)
def soft_delete_chapter(track: str, chapter_id: int, db: Session = Depends(get_db)):
    result = _svc(track, db).soft_delete_chapter(chapter_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chapter not found")
    return result


# ── Lessons ──────────────────────────────────────────────────────────────────


@router.get("/lessons", response_model=list[LessonResponse])
def list_lessons(
    track: str,
    chapter_id: int | None = Query(None),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    return _svc(track, db).list_lessons(chapter_id=chapter_id, active_only=active_only)


@router.post(
    "/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED
)
def create_lesson(track: str, body: LessonCreate, db: Session = Depends(get_db)):
    result = _svc(track, db).create_lesson(body)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Parent chapter not found")
    return result


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(track: str, lesson_id: int, db: Session = Depends(get_db)):
    result = _svc(track, db).get_lesson(lesson_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lesson not found")
    return result


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    track: str, lesson_id: int, body: LessonUpdate, db: Session = Depends(get_db)
):
    result = _svc(track, db).update_lesson(lesson_id, body)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lesson not found")
    return result


@router.delete("/lessons/{lesson_id}", response_model=LessonResponse)
def soft_delete_lesson(track: str, lesson_id: int, db: Session = Depends(get_db)):
    result = _svc(track, db).soft_delete_lesson(lesson_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lesson not found")
    return result
