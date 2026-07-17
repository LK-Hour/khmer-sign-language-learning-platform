"""Admin dictionary routes.

    /api/admin/dictionary/characters       GET  — paginated list of finger letters
    /api/admin/dictionary/characters/{id}  GET  — single letter detail
    /api/admin/dictionary/characters       POST — create a new letter
    /api/admin/dictionary/characters/{id}  PUT  — update a letter
    /api/admin/dictionary/words            GET  — paginated list of word detection words
    /api/admin/dictionary/words/{id}       GET  — single word detail
    /api/admin/dictionary/words            POST — create a new word
    /api/admin/dictionary/words/{id}       PUT  — update a word
"""

from __future__ import annotations

import math

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

import redis as redis_lib

from src.api.deps import get_admin_user, get_db
from src.core.cache import cache_get, cache_set
from src.core.redis import get_redis
from src.models.finger_spelling import FingerLetter, FingerLetterMedia
from src.models.media import Media
from src.models.user import User
from src.models.word_detection import WordDetectionWord, WordDetectionWordMedia

router = APIRouter(
    prefix="/api/admin/dictionary",
    tags=["admin-dictionary"],
)


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class LetterPayload(BaseModel):
    letter_en: str | None = None
    letter_kh: str
    description_en: str | None = None
    description_kh: str | None = None
    is_active: bool = True


class WordPayload(BaseModel):
    word_en: str | None = None
    word_kh: str
    description_en: str | None = None
    description_kh: str | None = None
    is_active: bool = True


# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialize_media(media: Media) -> dict:
    return {
        "id": media.id,
        "media_type": media.media_type,
        "file_url": media.file_url,
        "created_at": media.created_at.isoformat() if media.created_at else None,
        "associations": [],
    }


def _letter_detail(letter: FingerLetter, db: Session) -> dict:
    medias = (
        db.query(Media)
        .join(FingerLetterMedia, FingerLetterMedia.media_id == Media.id)
        .filter(FingerLetterMedia.letter_id == letter.id)
        .all()
    )
    return {
        "id": letter.id,
        "letter_en": letter.letter_en,
        "letter_kh": letter.letter_kh,
        "description_en": letter.description_en,
        "description_kh": letter.description_kh,
        "is_active": letter.is_active,
        "created_at": letter.created_at.isoformat() if letter.created_at else None,
        "updated_at": letter.updated_at.isoformat() if letter.updated_at else None,
        "medias": [_serialize_media(m) for m in medias],
    }


def _word_detail(word: WordDetectionWord, db: Session) -> dict:
    medias = (
        db.query(Media)
        .join(WordDetectionWordMedia, WordDetectionWordMedia.media_id == Media.id)
        .filter(WordDetectionWordMedia.word_id == word.id)
        .all()
    )
    return {
        "id": word.id,
        "word_en": word.word_en,
        "word_kh": word.word_kh,
        "description_en": word.description_en,
        "description_kh": word.description_kh,
        "is_active": word.is_active,
        "created_at": word.created_at.isoformat() if word.created_at else None,
        "updated_at": word.updated_at.isoformat() if word.updated_at else None,
        "medias": [_serialize_media(m) for m in medias],
    }


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


# ── Individual Character CRUD ─────────────────────────────────────────────────


@router.get("/characters/{character_id}")
def get_character(
    character_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Get a single letter by ID with its media associations."""
    letter = db.query(FingerLetter).filter(FingerLetter.id == character_id).first()
    if not letter:
        raise HTTPException(status_code=404, detail="Character not found")
    return _letter_detail(letter, db)


@router.post("/characters", status_code=201)
def create_character(
    body: LetterPayload,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Create a new letter."""
    letter = FingerLetter(
        letter_en=body.letter_en,
        letter_kh=body.letter_kh,
        description_en=body.description_en,
        description_kh=body.description_kh,
        is_active=body.is_active,
    )
    db.add(letter)
    db.commit()
    db.refresh(letter)
    return _letter_detail(letter, db)


@router.put("/characters/{character_id}")
def update_character(
    character_id: int,
    body: LetterPayload,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Update an existing letter."""
    letter = db.query(FingerLetter).filter(FingerLetter.id == character_id).first()
    if not letter:
        raise HTTPException(status_code=404, detail="Character not found")

    if body.letter_en is not None:
        letter.letter_en = body.letter_en
    letter.letter_kh = body.letter_kh
    if body.description_en is not None:
        letter.description_en = body.description_en
    if body.description_kh is not None:
        letter.description_kh = body.description_kh
    letter.is_active = body.is_active

    db.commit()
    db.refresh(letter)
    return _letter_detail(letter, db)


# ── Individual Word CRUD ──────────────────────────────────────────────────────


@router.get("/words/{word_id}")
def get_word(
    word_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Get a single word by ID with its media associations."""
    word = db.query(WordDetectionWord).filter(WordDetectionWord.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    return _word_detail(word, db)


@router.post("/words", status_code=201)
def create_word(
    body: WordPayload,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Create a new word."""
    word = WordDetectionWord(
        word_en=body.word_en,
        word_kh=body.word_kh,
        description_en=body.description_en,
        description_kh=body.description_kh,
        is_active=body.is_active,
    )
    db.add(word)
    db.commit()
    db.refresh(word)
    return _word_detail(word, db)


@router.put("/words/{word_id}")
def update_word(
    word_id: int,
    body: WordPayload,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Update an existing word."""
    word = db.query(WordDetectionWord).filter(WordDetectionWord.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    if body.word_en is not None:
        word.word_en = body.word_en
    word.word_kh = body.word_kh
    if body.description_en is not None:
        word.description_en = body.description_en
    if body.description_kh is not None:
        word.description_kh = body.description_kh
    word.is_active = body.is_active

    db.commit()
    db.refresh(word)
    return _word_detail(word, db)


@router.delete("/characters/{character_id}", status_code=204)
def delete_character(
    character_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Delete a letter. Cascades to its lesson associations and media links."""
    letter = db.query(FingerLetter).filter(FingerLetter.id == character_id).first()
    if not letter:
        raise HTTPException(status_code=404, detail="Character not found")
    db.delete(letter)
    db.commit()


@router.delete("/words/{word_id}", status_code=204)
def delete_word(
    word_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Delete a word. Cascades to its lesson associations and media links."""
    word = db.query(WordDetectionWord).filter(WordDetectionWord.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    db.delete(word)
    db.commit()
