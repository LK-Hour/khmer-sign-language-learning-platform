"""Admin exercise routes (track-parameterized).

Supports the required exercise types per track. For Finger Spelling:
``multiple_choice`` (4 choices), ``free_form`` (text input), ``image_select``
(choose between images). Soft delete via ``DELETE`` toggles ``is_active``.

    /api/admin/{track}/exercises             GET  POST
    /api/admin/{track}/exercises/{id}        GET  PUT  DELETE
    /api/admin/{track}/exercises/{id}/restore              POST
    /api/admin/{track}/exercises/{id}/publish              POST
    /api/admin/{track}/exercises/{id}/options              POST
    /api/admin/{track}/exercise-options/{id}               PUT  DELETE
    /api/admin/{track}/exercise-options/{id}/restore       POST

Create/update save exercises as ``draft`` (not learner-visible); the publish
endpoint is the explicit confirm action that makes them live.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.api.deps import get_admin_user
from src.schemas.admin.exercise import (
    ExerciseCreate,
    ExerciseOptionCreate,
    ExerciseOptionResponse,
    ExerciseOptionUpdate,
    ExerciseResponse,
    ExerciseUpdate,
)
from src.services.admin.exercise_admin_service import ExerciseAdminService

router = APIRouter(
    prefix="/api/admin/{track}",
    tags=["admin-exercise"],
    dependencies=[Depends(get_admin_user)],
)


def _svc(track: str, db: Session) -> ExerciseAdminService:
    return ExerciseAdminService(db, track)


# ── Exercises ────────────────────────────────────────────────────────────────


@router.get("/exercises", response_model=list[ExerciseResponse])
def list_exercises(
    track: str,
    lesson_id: int | None = Query(None),
    chapter_id: int | None = Query(None),
    unit_id: int | None = Query(None),
    active_only: bool = Query(False),
    publish_status: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    return _svc(track, db).list_exercises(
        lesson_id=lesson_id,
        chapter_id=chapter_id,
        unit_id=unit_id,
        active_only=active_only,
        status=publish_status,
    )


@router.post(
    "/exercises", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED
)
def create_exercise(track: str, body: ExerciseCreate, db: Session = Depends(get_db)):
    try:
        result = _svc(track, db).create_exercise(body)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Parent lesson not found")
    return result


@router.get("/exercises/{exercise_id}", response_model=ExerciseResponse)
def get_exercise(track: str, exercise_id: int, db: Session = Depends(get_db)):
    result = _svc(track, db).get_exercise(exercise_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exercise not found")
    return result


@router.put("/exercises/{exercise_id}", response_model=ExerciseResponse)
def update_exercise(
    track: str, exercise_id: int, body: ExerciseUpdate, db: Session = Depends(get_db)
):
    try:
        result = _svc(track, db).update_exercise(exercise_id, body)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exercise not found")
    return result


@router.delete("/exercises/{exercise_id}", response_model=ExerciseResponse)
def soft_delete_exercise(track: str, exercise_id: int, db: Session = Depends(get_db)):
    result = _svc(track, db).soft_delete_exercise(exercise_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exercise not found")
    return result


@router.post("/exercises/{exercise_id}/restore", response_model=ExerciseResponse)
def restore_exercise(track: str, exercise_id: int, db: Session = Depends(get_db)):
    result = _svc(track, db).restore_exercise(exercise_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exercise not found")
    return result


@router.post("/exercises/{exercise_id}/publish", response_model=ExerciseResponse)
def publish_exercise(
    track: str,
    exercise_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_admin_user),
):
    try:
        result = _svc(track, db).publish_exercise(exercise_id, user.id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exercise not found")
    return result


# ── Exercise options ─────────────────────────────────────────────────────────


@router.post(
    "/exercises/{exercise_id}/options",
    response_model=ExerciseOptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_option(
    track: str,
    exercise_id: int,
    body: ExerciseOptionCreate,
    db: Session = Depends(get_db),
):
    result = _svc(track, db).create_option(exercise_id, body)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exercise not found")
    return result


@router.put(
    "/exercise-options/{option_id}", response_model=ExerciseOptionResponse
)
def update_option(
    track: str,
    option_id: int,
    body: ExerciseOptionUpdate,
    db: Session = Depends(get_db),
):
    result = _svc(track, db).update_option(option_id, body)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Option not found")
    return result


@router.delete(
    "/exercise-options/{option_id}", status_code=status.HTTP_204_NO_CONTENT
)
def soft_delete_option(track: str, option_id: int, db: Session = Depends(get_db)):
    if not _svc(track, db).soft_delete_option(option_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Option not found")


@router.post(
    "/exercise-options/{option_id}/restore", status_code=status.HTTP_204_NO_CONTENT
)
def restore_option(track: str, option_id: int, db: Session = Depends(get_db)):
    if not _svc(track, db).restore_option(option_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Option not found")
