"""Legacy chapter exercise routes (retired — use unit exercise APIs)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.schemas.finger_spelling import ExerciseResponse
from src.services.finger_spelling.finger_exercise_service import FingerExerciseService

router = APIRouter(prefix="/api/finger_spelling/exercise", tags=["finger-spelling-exercise"])


@router.get("/chapters/{chapter_id}", response_model=list[ExerciseResponse])
def list_chapter_exercises(
    chapter_id: int,
    db: Session = Depends(get_db),
) -> list[ExerciseResponse]:
    """Get all exercises for all lessons in a chapter (read-only)."""
    exercises = FingerExerciseService(db).list_chapter_exercises(chapter_id)
    if exercises is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return [ExerciseResponse.model_validate(ex) for ex in exercises]


@router.post("/{exercise_id}/submit")
def submit_exercise(exercise_id: int) -> None:
    """Retired: per-question submit removed. Use unit exercise submit instead."""
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail=(
            "Per-question exercise submit is retired. "
            "Use POST /api/finger_spelling/units/{unit_id}/exercise/submit."
        ),
    )
