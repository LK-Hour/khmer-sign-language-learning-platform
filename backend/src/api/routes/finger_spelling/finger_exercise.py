"""Finger spelling chapter exercise routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.api.deps import get_current_user
from src.models.user import User
from src.schemas.finger_spelling import (
    ExerciseResponse,
    ExerciseSubmitRequest,
    ExerciseSubmitResponse,
)
from src.services.finger_spelling.finger_exercise_service import FingerExerciseService

router = APIRouter(prefix="/api/finger_spelling/exercise", tags=["finger-spelling-exercise"])


@router.get("/chapters/{chapter_id}", response_model=list[ExerciseResponse])
def list_chapter_exercises(
    chapter_id: int,
    db: Session = Depends(get_db),
) -> list[ExerciseResponse]:
    """Get all exercises for all lessons in a chapter."""
    exercises = FingerExerciseService(db).list_chapter_exercises(chapter_id)
    if exercises is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return [ExerciseResponse.model_validate(ex) for ex in exercises]


@router.post("/{exercise_id}/submit", response_model=ExerciseSubmitResponse)
def submit_exercise(
    exercise_id: int,
    body: ExerciseSubmitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExerciseSubmitResponse:
    result = FingerExerciseService(db).submit_answer(
        user_id=user.id,
        exercise_id=exercise_id,
        selected_option_id=body.selected_option_id,
        selected_answer=body.selected_answer,
        time_taken=body.time_taken,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")
    return ExerciseSubmitResponse(
        is_correct=result.is_correct,
        attempt_number=result.attempt_number,
        lesson_id=result.lesson_id,
        progress_id=result.progress_id,
        explanation_en=result.explanation_en,
        explanation_kh=result.explanation_kh,
    )
