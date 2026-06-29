"""Word detection chapter exercise routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.schemas.word_detection import (
    WdExerciseResponse,
    WdExerciseSubmitRequest,
    WdExerciseSubmitResponse,
)
from src.services.word_detection.word_detection_exercise_service import (
    WordDetectionExerciseService,
)

router = APIRouter(
    prefix="/api/word_detection/exercise", tags=["word-detection-exercise"]
)


@router.get("/chapters/{chapter_id}", response_model=list[WdExerciseResponse])
def list_chapter_exercises(
    chapter_id: int,
    db: Session = Depends(get_db),
) -> list[WdExerciseResponse]:
    """Get all exercises for all lessons in a chapter."""
    exercises = WordDetectionExerciseService(db).list_chapter_exercises(chapter_id)
    if exercises is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return [WdExerciseResponse.model_validate(ex) for ex in exercises]


@router.post("/{exercise_id}/submit", response_model=WdExerciseSubmitResponse)
def submit_exercise(
    exercise_id: int,
    body: WdExerciseSubmitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> WdExerciseSubmitResponse:
    result = WordDetectionExerciseService(db).submit_answer(
        user_id=user.id,
        exercise_id=exercise_id,
        selected_option_id=body.selected_option_id,
        selected_answer=body.selected_answer,
        time_taken=body.time_taken,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")
    return WdExerciseSubmitResponse(
        is_correct=result.is_correct,
        attempt_number=result.attempt_number,
        lesson_id=result.lesson_id,
        progress_id=result.progress_id,
        explanation_en=result.explanation_en,
        explanation_kh=result.explanation_kh,
    )
