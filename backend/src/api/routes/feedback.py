from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.models.feedback import LessonFeedback
from src.models.finger_spelling import FingerLesson
from src.schemas.feedback import LessonFeedbackCreateRequest, LessonFeedbackResponse

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=LessonFeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    body: LessonFeedbackCreateRequest,
    db: Session = Depends(get_db),
) -> LessonFeedbackResponse:
    lesson = db.get(FingerLesson, body.lesson_id)
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )

    feedback = LessonFeedback(
        type=body.type,
        category=body.category,
        lesson_id=body.lesson_id,
        characteristic=body.characteristic,
        mood=body.mood,
        comment=body.comment.strip() or None if body.comment else None,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback