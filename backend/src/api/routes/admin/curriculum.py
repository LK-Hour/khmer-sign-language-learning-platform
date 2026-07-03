"""Admin curriculum routes (track-parameterized, centralized).

Single admin role; every endpoint requires ``account_type=admin``.

Lifecycle contract:
- POST / PUT save changes as ``draft`` (not learner-visible).
- POST ``/{id}/publish`` is the explicit confirm action that makes a row live.
- DELETE soft-deletes (``is_active=false``); POST ``/{id}/restore`` reactivates.

    /api/admin/{track}/units                 GET  POST
    /api/admin/{track}/units/{id}            GET  PUT  DELETE
    /api/admin/{track}/units/{id}/restore    POST
    /api/admin/{track}/units/{id}/publish    POST
    (same shape for /chapters and /lessons)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.deps import get_admin_user, get_db
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
from src.services.admin.curriculum_admin_service import CurriculumAdminService

router = APIRouter(
    prefix="/api/admin/{track}",
    tags=["admin-curriculum"],
)


def _svc(track: str, db: Session) -> CurriculumAdminService:
    return CurriculumAdminService(db, track)


def _found(result, entity: str):
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{entity} not found")
    return result


# ── Units ────────────────────────────────────────────────────────────────────


@router.get("/units", response_model=list[UnitResponse])
def list_units(
    track: str,
    active_only: bool = Query(False),
    publish_status: str | None = Query(None, alias="status"),
    q: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _svc(track, db).list_units(active_only=active_only, status=publish_status, q=q)


@router.post("/units", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
def create_unit(
    track: str,
    body: UnitCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _svc(track, db).create_unit(body)


@router.get("/units/{unit_id}", response_model=UnitResponse)
def get_unit(
    track: str,
    unit_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).get_unit(unit_id), "Unit")


@router.put("/units/{unit_id}", response_model=UnitResponse)
def update_unit(
    track: str,
    unit_id: int,
    body: UnitUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).update_unit(unit_id, body), "Unit")


@router.delete("/units/{unit_id}", response_model=UnitResponse)
def soft_delete_unit(
    track: str,
    unit_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).soft_delete_unit(unit_id), "Unit")


@router.post("/units/{unit_id}/restore", response_model=UnitResponse)
def restore_unit(
    track: str,
    unit_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).restore_unit(unit_id), "Unit")


@router.post("/units/{unit_id}/publish", response_model=UnitResponse)
def publish_unit(
    track: str,
    unit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    try:
        return _found(_svc(track, db).publish_unit(unit_id, user.id), "Unit")
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc


# ── Chapters ─────────────────────────────────────────────────────────────────


@router.get("/chapters", response_model=list[ChapterResponse])
def list_chapters(
    track: str,
    unit_id: int | None = Query(None),
    active_only: bool = Query(False),
    publish_status: str | None = Query(None, alias="status"),
    q: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _svc(track, db).list_chapters(
        unit_id=unit_id, active_only=active_only, status=publish_status, q=q
    )


@router.post("/chapters", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
def create_chapter(
    track: str,
    body: ChapterCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).create_chapter(body), "Parent unit")


@router.get("/chapters/{chapter_id}", response_model=ChapterResponse)
def get_chapter(
    track: str,
    chapter_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).get_chapter(chapter_id), "Chapter")


@router.put("/chapters/{chapter_id}", response_model=ChapterResponse)
def update_chapter(
    track: str,
    chapter_id: int,
    body: ChapterUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).update_chapter(chapter_id, body), "Chapter")


@router.delete("/chapters/{chapter_id}", response_model=ChapterResponse)
def soft_delete_chapter(
    track: str,
    chapter_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).soft_delete_chapter(chapter_id), "Chapter")


@router.post("/chapters/{chapter_id}/restore", response_model=ChapterResponse)
def restore_chapter(
    track: str,
    chapter_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).restore_chapter(chapter_id), "Chapter")


@router.post("/chapters/{chapter_id}/publish", response_model=ChapterResponse)
def publish_chapter(
    track: str,
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    try:
        return _found(_svc(track, db).publish_chapter(chapter_id, user.id), "Chapter")
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc


# ── Lessons ──────────────────────────────────────────────────────────────────


@router.get("/lessons", response_model=list[LessonResponse])
def list_lessons(
    track: str,
    chapter_id: int | None = Query(None),
    active_only: bool = Query(False),
    publish_status: str | None = Query(None, alias="status"),
    q: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _svc(track, db).list_lessons(
        chapter_id=chapter_id, active_only=active_only, status=publish_status, q=q
    )


@router.post("/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(
    track: str,
    body: LessonCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).create_lesson(body), "Parent chapter")


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    track: str,
    lesson_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).get_lesson(lesson_id), "Lesson")


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    track: str,
    lesson_id: int,
    body: LessonUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).update_lesson(lesson_id, body), "Lesson")


@router.delete("/lessons/{lesson_id}", response_model=LessonResponse)
def soft_delete_lesson(
    track: str,
    lesson_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).soft_delete_lesson(lesson_id), "Lesson")


@router.post("/lessons/{lesson_id}/restore", response_model=LessonResponse)
def restore_lesson(
    track: str,
    lesson_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).restore_lesson(lesson_id), "Lesson")


@router.post("/lessons/{lesson_id}/publish", response_model=LessonResponse)
def publish_lesson(
    track: str,
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    try:
        return _found(_svc(track, db).publish_lesson(lesson_id, user.id), "Lesson")
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
