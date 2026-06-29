"""Finger spelling practice routes — simplified: records attempt directly to lesson progress."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.api.deps import get_current_user
from src.models.user import User
from src.schemas.finger_spelling import (
    PracticeAttemptRequest,
    PracticeAttemptResponse,
)
from src.services.finger_spelling.finger_practice_service import FingerPracticeService

router = APIRouter(prefix="/api/finger_spelling/practice", tags=["finger-spelling-practice"])


@router.post("/lessons/{lesson_id}/attempt", response_model=PracticeAttemptResponse)
def record_practice_attempt(
    lesson_id: int,
    body: PracticeAttemptRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PracticeAttemptResponse:
    result = FingerPracticeService(db).record_attempt(
        user_id=user.id,
        lesson_id=lesson_id,
        accuracy=body.accuracy,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return PracticeAttemptResponse(
        lesson_id=result.lesson_id,
        accuracy=result.accuracy,
        lesson_completed=result.lesson_completed,
    )