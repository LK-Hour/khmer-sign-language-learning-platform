"""Admin media management routes.

Provides CRUD endpoints for browsing, uploading, associating, and
soft-deleting media assets. All endpoints require admin authentication.

    /api/admin/media              GET  -paginated list with media_type filter
    /api/admin/media              POST -upload new media (multipart/form-data)
    /api/admin/media/{id}         GET  -detail with associations
    /api/admin/media/{id}         DELETE-soft-delete (is_active=false); file and links are kept
    /api/admin/media/{id}/restore      POST  -reactivate soft-deleted media
    /api/admin/media/{id}/associate    POST  -link media to letter/word
    /api/admin/media/{id}/associate    DELETE-unlink media from letter/word
"""

from __future__ import annotations

import math
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

import redis as redis_lib

from src.api.deps import get_admin_user, get_db
from src.core.cache import cache_invalidate, cache_invalidate_pattern
from src.core.config import settings
from src.core.redis import get_redis
from src.models.finger_spelling import (
    FingerExercise,
    FingerExerciseOption,
    FingerLetter,
    FingerLetterMedia,
)
from src.models.media import Media, MediaType
from src.models.user import User
from src.models.word_detection import (
    WordDetectionExercise,
    WordDetectionExerciseOption,
    WordDetectionWord,
    WordDetectionWordMedia,
)
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


def _invalidate_media_related_cache(rc: redis_lib.Redis) -> None:
    """Invalidate public caches that embed media info (dictionary, letters,
    and the finger-spelling / word-detection curriculum trees).

    Media associations affect media_count / medias lists returned by the
    public dictionary and letter-lookup endpoints, as well as the
    image_url / video_url fields embedded in the cached finger-spelling and
    word-detection tree structures, so any delete, associate, or
    disassociate, or restore action must bust all of those caches.
    """
    cache_invalidate_pattern(rc, "ksl:cache:public:dict:*")
    cache_invalidate_pattern(rc, "ksl:cache:public:letter:*")
    cache_invalidate_pattern(rc, "ksl:cache:dict:*")
    cache_invalidate(rc, "ksl:cache:public:fs:tree:structure")
    cache_invalidate(rc, "ksl:cache:public:wd:tree:structure")

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


def _media_response(db: Session, media: Media) -> MediaResponse:
    return MediaResponse(
        id=media.id,
        media_type=media.media_type,
        file_url=media.file_url,
        is_active=media.is_active,
        created_at=media.created_at,
        associations=_get_associations(db, media.id),
    )


def _count_exercise_references(db: Session, media_id: int) -> int:
    """Count exercises and exercise options (both tracks) that point at this
    media through their ``media_id`` column."""
    return sum(
        db.query(func.count(model.id)).filter(model.media_id == media_id).scalar() or 0
        for model in (
            FingerExercise,
            FingerExerciseOption,
            WordDetectionExercise,
            WordDetectionExerciseOption,
        )
    )


@router.get("", response_model=PaginatedMediaResponse)
def list_media(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    media_type: str | None = Query(None),
    search: str | None = Query(None),
    include_inactive: bool = Query(False, description="Include soft-deleted media"),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """List media assets with pagination, optional media_type filter, and file name search.

    Soft-deleted media is hidden unless ``include_inactive`` is set.
    """
    query = db.query(Media)

    if not include_inactive:
        query = query.filter(Media.is_active.is_(True))

    if media_type:
        query = query.filter(Media.media_type == media_type)

    if search:
        query = query.filter(Media.file_url.ilike(f"%{search}%"))

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size

    media_items = query.order_by(Media.id.asc()).offset(offset).limit(size).all()

    return PaginatedMediaResponse(
        items=[_media_response(db, media) for media in media_items],
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

        return _media_response(db, media)
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

    return _media_response(db, media)


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Soft-delete a media asset (``is_active=false``).

    The database row, the file on disk, and its letter/word links are all
    kept, so restore brings it back exactly as it was. Learner-facing reads
    skip inactive media. Media still used directly by an exercise or option
    is rejected with 409 so no exercise ends up pointing at hidden media.
    """
    media = db.get(Media, media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )

    in_use = _count_exercise_references(db, media.id)
    if in_use:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Media is used by {in_use} exercise(s) or option(s); reassign them first",
        )

    media.is_active = False
    db.commit()

    _invalidate_media_related_cache(rc)


@router.post("/{media_id}/restore", response_model=MediaResponse)
def restore_media(
    media_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Reactivate a soft-deleted media asset."""
    media = db.get(Media, media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )

    media.is_active = True
    db.commit()
    db.refresh(media)

    _invalidate_media_related_cache(rc)
    return _media_response(db, media)


@router.post("/{media_id}/associate", response_model=MediaResponse)
def associate_media(
    media_id: int,
    body: AssociateMediaRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Link media to a letter or word.

    Creates a junction record in the appropriate table (FingerLetterMedia or
    WordDetectionWordMedia). Returns 404 if media or target not found, 409 if
    the media is soft-deleted or the association already exists.
    """
    media = db.get(Media, media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )
    if not media.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Media is deleted; restore it first",
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
    _invalidate_media_related_cache(rc)

    # Return updated media with associations
    return _media_response(db, media)


@router.delete("/{media_id}/associate", status_code=status.HTTP_200_OK, response_model=MediaResponse)
def disassociate_media(
    media_id: int,
    body: AssociateMediaRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
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
    _invalidate_media_related_cache(rc)

    # Return updated media with remaining associations
    return _media_response(db, media)
