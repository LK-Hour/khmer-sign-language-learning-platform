"""Sentence-spelling practice attempt routes (learner-facing)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.api.deps import get_current_user
from src.models.sentence_spelling import SentenceSpellingSource
from src.models.user import User
from src.schemas.sentence_spelling import (
    CustomHistoryEntryResponse,
    PracticeAttemptRequest,
    PracticeAttemptResponse,
    RecentPracticeResponse,
)
from src.services.sentence_spelling import SentencePracticeService

MAX_CUSTOM_HISTORY = 20

router = APIRouter(prefix="/api/sentence_spelling/practice", tags=["sentence-spelling-practice"])


@router.post("/attempts", response_model=PracticeAttemptResponse)
def record_practice_attempt(
    body: PracticeAttemptRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PracticeAttemptResponse:
    try:
        source = SentenceSpellingSource(body.source)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="source must be 'sample' or 'custom'",
        )

    service = SentencePracticeService(db)
    attempt = service.record_attempt(
        user_id=user.id,
        source=source,
        sentence_id=body.sentence_id,
        practiced_text=body.practiced_text,
        character_count=body.character_count,
        accuracy_percent=body.accuracy_percent,
    )
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sentence not found")

    return PracticeAttemptResponse(
        id=str(attempt.id),
        source=attempt.source,
        sentence_id=attempt.sentence_id,
        practiced_text=attempt.practiced_text,
        character_count=attempt.character_count,
        accuracy_percent=attempt.accuracy_percent,
        completed_at=attempt.completed_at,
    )


@router.get("/recent", response_model=RecentPracticeResponse)
def get_recent_practice(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RecentPracticeResponse:
    service = SentencePracticeService(db)
    attempt = service.get_recent_attempt(user.id)
    if attempt is None:
        return RecentPracticeResponse()

    return RecentPracticeResponse(
        source=attempt.source,
        practiced_text=attempt.practiced_text,
        accuracy_percent=attempt.accuracy_percent,
        completed_at=attempt.completed_at,
    )


@router.get("/custom-history", response_model=list[CustomHistoryEntryResponse])
def list_custom_history(
    limit: int = Query(default=5, ge=1, le=MAX_CUSTOM_HISTORY),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[CustomHistoryEntryResponse]:
    service = SentencePracticeService(db)
    attempts = service.list_recent_custom_texts(user.id, limit=limit)
    return [
        CustomHistoryEntryResponse(
            practiced_text=attempt.practiced_text,
            completed_at=attempt.completed_at,
        )
        for attempt in attempts
    ]
