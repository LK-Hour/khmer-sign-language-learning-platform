"""Word-detection user contribution upload routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from src.api.deps import get_db, get_optional_user
from src.models.user import User
from src.schemas.word_detection import WdContributionUploadResponse
from src.services.word_detection.word_detection_contribution_service import (
    WordDetectionContributionService,
)

router = APIRouter(prefix="/api/word_detection", tags=["word-detection"])
GUEST_ID_HEADER = "X-KSL-Guest-Id"


def _require_user_or_guest(user: User | None, guest_id: str | None) -> str | None:
    if user is not None:
        return None
    if guest_id and guest_id.startswith("guest_"):
        return guest_id
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")


@router.post("/contributions", response_model=WdContributionUploadResponse)
def upload_contribution(
    video: UploadFile = File(...),
    lesson_id: int | None = Form(default=None),
    word: str = Form(...),
    predicted_label: str | None = Form(default=None),
    confidence: float | None = Form(default=None),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    guest_id: str | None = Header(default=None, alias=GUEST_ID_HEADER),
) -> WdContributionUploadResponse:
    del predicted_label, confidence
    effective_guest_id = _require_user_or_guest(user, guest_id)

    content_type = (video.content_type or "").lower()
    if not content_type.startswith("video/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Uploaded file must be a video",
        )

    service = WordDetectionContributionService(db)
    word_row = service.get_word_by_label(word)
    if word_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Word not found")

    lesson = service.get_lesson(lesson_id)
    if lesson_id is not None and lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    contribution = service.save_upload(
        upload=video,
        word=word_row,
        lesson=lesson,
        user_id=user.id if user else None,
        guest_id=effective_guest_id,
    )
    return WdContributionUploadResponse(
        id=contribution.id,
        contribution_media_id=contribution.contribution_media_id or 0,
        file_url=contribution.contribution_media.file_url if contribution.contribution_media else "",
        status=contribution.status,
    )
