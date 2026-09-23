"""Finger-letter reference-image lookup routes.

GET /api/finger_spelling/letters/media
    Batch-resolves reference sign images for a set of Khmer characters.
    Used by other tracks (e.g. sentence-spelling) that need per-character
    images without going through the lesson/chapter curriculum.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.schemas.finger_spelling import FsLetterMediaItem, FsLetterMediaResponse
from src.services.finger_spelling.finger_letter_media_service import (
    FingerLetterMediaService,
)

router = APIRouter(prefix="/api/finger_spelling", tags=["finger-spelling-letters"])


@router.get("/letters/media", response_model=FsLetterMediaResponse)
def get_letters_media(
    chars: list[str] = Query(..., description="Khmer characters to resolve images for"),
    db: Session = Depends(get_db),
) -> FsLetterMediaResponse:
    svc = FingerLetterMediaService(db)
    resolved = svc.resolve_media_for_letters(chars)
    return FsLetterMediaResponse(
        items=[
            FsLetterMediaItem(letterKh=letter_kh, imageUrl=image_url)
            for letter_kh, image_url in resolved.items()
        ]
    )
