"""Admin media management routes.

Provides CRUD endpoints for browsing, uploading, associating, and deleting
media assets. All endpoints require admin authentication.

    /api/admin/media              GET   — paginated list with media_type filter
    /api/admin/media              POST  — upload new media (multipart/form-data)
    /api/admin/media/{id}         GET   — detail with associations
    /api/admin/media/{id}         DELETE — delete media record + file
    /api/admin/media/{id}/associate    POST   — link media to letter/word
    /api/admin/media/{id}/associate    DELETE — unlink media from letter/word
"""

from __future__ import annotations

import math
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.api.deps import get_admin_user, get_db
from src.core.config import settings
from src.models.finger_spelling import FingerLetter, FingerLetterMedia
from src.models.media import Media, MediaType
from src.models.user import User
from src.models.word_detection import WordDetectionWord, WordDetectionWordMedia
from src.schemas.admin.media import (
    AssociateMediaRequest,
    MediaAssociation,
    MediaResponse,
    PaginatedMediaResponse,
)

router = APIRouter(
    prefix="/api/admin/media",
    tags=["admin-media"],
)

# Allowed MIME types for media upload
ALLOWED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/gif",
    "video/mp4",
    "video/webm",
}

# Map MIME types to MediaType enum values
MIME_TO_MEDIA_TYPE = {
    "image/png": MediaType.IMAGE,
    "image/jpeg": MediaType.IMAGE,
    "image/gif": MediaType.GIF,
    "video/mp4": MediaType.VIDEO,
    "video/webm": MediaType.VIDEO,
}

# Map MIME types to file extensions
MIME_TO_EXTENSION = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
}

MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50MB


def _get_associations(db: Session, media_id: int) -> list[MediaAssociation]:
    """Fetch all letter and word associations for a media asset."""
    associations: list[MediaAssociation] = []

    # Finger letter associations
    letter_links = (
        db.query(FingerLetterMedia)
        .filter(FingerLetterMedia.media_id == media_id)
        .all()
    )
    for link in letter_links:
        letter = db.get(FingerLetter, link.letter_id)
        associations.append(
            MediaAssociation(
                target_type="letter",
                target_id=link.letter_id,
                target_name=letter.letter_kh if letter else "Unknown",
            )
        )

    # Word detection word associations
    word_links = (
        db.query(WordDetectionWordMedia)
        .filter(WordDetectionWordMedia.media_id == media_id)
        .all()
    )
    for link in word_links:
        word = db.get(WordDetectionWord, link.word_id)
        associations.append(
            MediaAssociation(
                target_type="word",
                target_id=link.word_id,
                target_name=word.word_kh if word else "Unknown",
            )
        )

    return associations


@router.get("", response_model=PaginatedMediaResponse)
def list_media(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    media_type: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """List media assets with pagination, optional media_type filter, and file name search."""
    query = db.query(Media)

    if media_type:
        query = query.filter(Media.media_type == media_type)

    if search:
        query = query.filter(Media.file_url.ilike(f"%{search}%"))

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size

    media_items = query.order_by(Media.id.asc()).offset(offset).limit(size).all()

    items = []
    for media in media_items:
        associations = _get_associations(db, media.id)
        items.append(
            MediaResponse(
                id=media.id,
                media_type=media.media_type,
                file_url=media.file_url,
                created_at=media.created_at,
                associations=associations,
            )
        )

    return PaginatedMediaResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post("", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
def upload_media(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Upload a new media file. Validates MIME type against allowlist."""
    content_type = (file.content_type or "").lower()

    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type: {content_type}",
        )

    media_type = MIME_TO_MEDIA_TYPE[content_type]
    extension = MIME_TO_EXTENSION[content_type]

    # Create upload directory
    upload_dir: Path = settings.media_upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    filename = f"media-{uuid4().hex[:12]}{extension}"
    file_path = upload_dir / filename
    relative_url = f"/data_set/media_uploads/{filename}"

    try:
        written = 0
        with file_path.open("wb") as out_file:
            while chunk := file.file.read(1024 * 1024):
                written += len(chunk)
                if written > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds maximum size of 50MB",
                    )
                out_file.write(chunk)

        media = Media(media_type=media_type.value, file_url=relative_url)
        db.add(media)
        db.commit()
        db.refresh(media)

        return MediaResponse(
            id=media.id,
            media_type=media.media_type,
            file_url=media.file_url,
            created_at=media.created_at,
            associations=[],
        )
    except HTTPException:
        if file_path.exists():
            file_path.unlink()
        raise
    except Exception:
        db.rollback()
        if file_path.exists():
            file_path.unlink()
        raise


@router.get("/{media_id}", response_model=MediaResponse)
def get_media_detail(
    media_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Get media detail including associations."""
    media = db.get(Media, media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )

    associations = _get_associations(db, media.id)
    return MediaResponse(
        id=media.id,
        media_type=media.media_type,
        file_url=media.file_url,
        created_at=media.created_at,
        associations=associations,
    )


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Delete media record and associated file from disk."""
    media = db.get(Media, media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )

    # Attempt to delete the file from disk
    # The file_url is a relative URL like /data_set/media_uploads/filename.ext
    # We need to resolve it to the actual file path
    file_url = media.file_url
    if file_url:
        # Try to resolve the file path from the URL
        # Handle URLs like /data_set/media_uploads/filename.ext
        if "/data_set/media_uploads/" in file_url:
            filename = file_url.split("/data_set/media_uploads/")[-1]
            file_path = settings.media_upload_dir / filename
            if file_path.exists():
                file_path.unlink()
        else:
            # For files stored in other locations, try a best-effort approach
            # using the repo root
            repo_root = Path(settings.media_upload_dir).parent.parent
            relative_path = file_url.lstrip("/")
            file_path = repo_root / relative_path
            if file_path.exists():
                file_path.unlink()

    # Delete the database record (cascade will handle junction table entries)
    db.delete(media)
    db.commit()


@router.post("/{media_id}/associate", response_model=MediaResponse)
def associate_media(
    media_id: int,
    body: AssociateMediaRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Link media to a letter or word.

    Creates a junction record in the appropriate table (FingerLetterMedia or
    WordDetectionWordMedia). Returns 404 if media or target not found, 409 if
    the association already exists.
    """
    media = db.get(Media, media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )

    if body.target_type == "letter":
        letter = db.get(FingerLetter, body.target_id)
        if not letter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Letter not found",
            )

        # Check for existing association
        existing = (
            db.query(FingerLetterMedia)
            .filter(
                FingerLetterMedia.letter_id == body.target_id,
                FingerLetterMedia.media_id == media_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already associated",
            )

        link = FingerLetterMedia(letter_id=body.target_id, media_id=media_id)
        db.add(link)

    else:  # body.target_type == "word"
        word = db.get(WordDetectionWord, body.target_id)
        if not word:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Word not found",
            )

        # Check for existing association
        existing = (
            db.query(WordDetectionWordMedia)
            .filter(
                WordDetectionWordMedia.word_id == body.target_id,
                WordDetectionWordMedia.media_id == media_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already associated",
            )

        link = WordDetectionWordMedia(word_id=body.target_id, media_id=media_id)
        db.add(link)

    db.commit()

    # Return updated media with associations
    associations = _get_associations(db, media.id)
    return MediaResponse(
        id=media.id,
        media_type=media.media_type,
        file_url=media.file_url,
        created_at=media.created_at,
        associations=associations,
    )


@router.delete("/{media_id}/associate", status_code=status.HTTP_200_OK, response_model=MediaResponse)
def disassociate_media(
    media_id: int,
    body: AssociateMediaRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Unlink media from a letter or word.

    Removes the junction record from the appropriate table. Returns 404 if
    media not found or if the association does not exist.
    """
    media = db.get(Media, media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )

    if body.target_type == "letter":
        link = (
            db.query(FingerLetterMedia)
            .filter(
                FingerLetterMedia.letter_id == body.target_id,
                FingerLetterMedia.media_id == media_id,
            )
            .first()
        )
        if not link:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Association not found",
            )
        db.delete(link)

    else:  # body.target_type == "word"
        link = (
            db.query(WordDetectionWordMedia)
            .filter(
                WordDetectionWordMedia.word_id == body.target_id,
                WordDetectionWordMedia.media_id == media_id,
            )
            .first()
        )
        if not link:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Association not found",
            )
        db.delete(link)

    db.commit()

    # Return updated media with remaining associations
    associations = _get_associations(db, media.id)
    return MediaResponse(
        id=media.id,
        media_type=media.media_type,
        file_url=media.file_url,
        created_at=media.created_at,
        associations=associations,
    )
