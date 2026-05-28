"""Finger spelling exercise routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.schemas.finger_spelling import (
    ExerciseResponse,
    ExerciseSubmitRequest,
    ExerciseSubmitResponse,
)
from src.services.finger_spelling.finger_exercise_service import FingerExerciseService

router = APIRouter(prefix="/api/finger_spelling/exercise", tags=["finger-spelling-exercise"])


@router.get("/lessons/{lesson_id}", response_model=list[ExerciseResponse])
def list_lesson_exercises(
    lesson_id: int,
    db: Session = Depends(get_db),
) -> list[ExerciseResponse]:
    exercises = FingerExerciseService(db).list_lesson_exercises(lesson_id)
    if exercises is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
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
        progress_id=str(result.progress_id),
        explanation_en=result.explanation_en,
        explanation_kh=result.explanation_kh,
    )
