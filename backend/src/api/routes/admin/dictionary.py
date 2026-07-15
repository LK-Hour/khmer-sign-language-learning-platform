"""Admin dictionary routes.

    /api/admin/dictionary/characters   GET — paginated list of finger letters
    /api/admin/dictionary/words        GET — paginated list of word detection words
"""

from __future__ import annotations

import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

import redis as redis_lib

from src.api.deps import get_admin_user, get_db
from src.core.cache import cache_get, cache_set
from src.core.redis import get_redis
from src.models.finger_spelling import FingerLetter, FingerLetterMedia
from src.models.user import User
from src.models.word_detection import WordDetectionWord, WordDetectionWordMedia

router = APIRouter(
    prefix="/api/admin/dictionary",
    tags=["admin-dictionary"],
)


@router.get("/characters")
def list_characters(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """List finger letters with pagination and optional search."""
    # Cache unfiltered paginated requests
    cache_key = f"ksl:cache:dict:characters:p{page}:s{size}:q{search or ''}"
    cached = cache_get(rc, cache_key)
    if cached is not None:
        return cached

    query = db.query(FingerLetter)

    if search:
        query = query.filter(
            FingerLetter.letter_kh.ilike(f"%{search}%")
            | FingerLetter.letter_en.ilike(f"%{search}%")
        )

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size

    letters = query.order_by(FingerLetter.id.asc()).offset(offset).limit(size).all()

    items = []
    for letter in letters:
        media_count = (
            db.query(func.count(FingerLetterMedia.id))
            .filter(FingerLetterMedia.letter_id == letter.id)
            .scalar()
        )
        items.append(
            {
                "id": letter.id,
                "name_en": letter.letter_en,
                "name_kh": letter.letter_kh,
                "media_count": media_count or 0,
                "is_active": letter.is_active,
                "created_at": letter.created_at.isoformat() if letter.created_at else None,
            }
        )

    result = {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }
    cache_set(rc, cache_key, result, ttl=300)  # 5 min TTL
    return result


@router.get("/words")
def list_words(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """List word detection words with pagination and optional search."""
    cache_key = f"ksl:cache:dict:words:p{page}:s{size}:q{search or ''}"
    cached = cache_get(rc, cache_key)
    if cached is not None:
        return cached

    query = db.query(WordDetectionWord)

    if search:
        query = query.filter(
            WordDetectionWord.word_kh.ilike(f"%{search}%")
            | WordDetectionWord.word_en.ilike(f"%{search}%")
        )

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size

    words = query.order_by(WordDetectionWord.id.asc()).offset(offset).limit(size).all()

    items = []
    for word in words:
        media_count = (
            db.query(func.count(WordDetectionWordMedia.id))
            .filter(WordDetectionWordMedia.word_id == word.id)
            .scalar()
        )
        items.append(
            {
                "id": word.id,
                "name_en": word.word_en,
                "name_kh": word.word_kh,
                "media_count": media_count or 0,
                "is_active": word.is_active,
                "created_at": word.created_at.isoformat() if word.created_at else None,
            }
        )

    result = {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }
    cache_set(rc, cache_key, result, ttl=300)  # 5 min TTL
    return result
