"""Finger spelling practice routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.schemas.finger_spelling import (
    PracticeAccuracyResponse,
    PracticeEndResponse,
    PracticeLetterSubmitRequest,
    PracticeLetterSubmitResponse,
    PracticeSessionResponse,
    PracticeSessionStartRequest,
)
from src.services.finger_spelling.finger_practice_service import FingerPracticeService
from src.services.finger_spelling.finger_progress_service import FingerProgressService

router = APIRouter(prefix="/api/finger_spelling/practice", tags=["finger-spelling-practice"])


@router.post("/lessons/{lesson_id}/sessions", response_model=PracticeSessionResponse)
def start_practice_session(
    lesson_id: int,
    body: PracticeSessionStartRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PracticeSessionResponse:
    session = FingerPracticeService(db).start_session(
        user_id=user.id,
        lesson_id=lesson_id,
        media_id=body.media_id,
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return PracticeSessionResponse(
        id=session.id,
        lesson_id=session.lesson_id,
        started_at=session.started_at,
        is_completed=session.is_completed,
    )


@router.post("/sessions/{session_id}/letters", response_model=PracticeLetterSubmitResponse)
def submit_practice_letter(
    session_id: int,
    body: PracticeLetterSubmitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PracticeLetterSubmitResponse:
    result = FingerPracticeService(db).submit_letter(
        user_id=user.id,
        session_id=session_id,
        letter_id=body.letter_id,
        accuracy=body.accuracy,
        attempts=body.attempts,
        time_spent_seconds=body.time_spent_seconds,
        media_id=body.media_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or completed practice session, or letter not in lesson",
        )
    return PracticeLetterSubmitResponse(
        session_id=result.session_id,
        letter_id=result.letter_id,
        accuracy=result.accuracy,
    )


@router.post("/sessions/{session_id}/end", response_model=PracticeEndResponse)
def end_practice_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PracticeEndResponse:
    result = FingerPracticeService(db).end_session(user_id=user.id, session_id=session_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Practice session not found or already completed",
        )
    progress = FingerProgressService(db).get_lesson_progress(user.id, result.session.lesson_id)
    lesson_completed = progress is not None and progress.is_completed
    return PracticeEndResponse(
        session_id=result.session.id,
        lesson_id=result.session.lesson_id,
        average_accuracy=result.average_accuracy,
        peak_accuracy=result.peak_accuracy,
        duration_seconds=result.duration_seconds,
        lesson_completed=lesson_completed,
    )


@router.get("/sessions/{session_id}/accuracy", response_model=PracticeAccuracyResponse)
def get_session_accuracy(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PracticeAccuracyResponse:
    result = FingerPracticeService(db).get_session_accuracy(user_id=user.id, session_id=session_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Practice session not found")

    return PracticeAccuracyResponse(
        session_id=result.session.id,
        lesson_id=result.session.lesson_id,
        average_accuracy=result.average_accuracy,
        peak_accuracy=result.peak_accuracy,
        samples=result.samples,
        is_completed=result.session.is_completed,
    )
