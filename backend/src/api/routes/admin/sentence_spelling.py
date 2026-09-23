"""Admin sentence-spelling routes.

    /api/admin/sentence_spelling/sentences       GET  — paginated list of sentences
    /api/admin/sentence_spelling/sentences/{id}  GET  — single sentence detail
    /api/admin/sentence_spelling/sentences       POST — create a new sentence
    /api/admin/sentence_spelling/sentences/{id}  PUT  — update a sentence
    /api/admin/sentence_spelling/sentences/{id}  DELETE — delete a sentence
"""

from __future__ import annotations

import math

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import redis as redis_lib

from src.api.deps import get_admin_user, get_db
from src.core.cache import cache_get, cache_invalidate_pattern, cache_set
from src.core.redis import get_redis
from src.models.sentence_spelling import SentenceSpellingSentence
from src.models.user import User

router = APIRouter(
    prefix="/api/admin/sentence_spelling",
    tags=["admin-sentence-spelling"],
)

_CACHE_PATTERN = "ksl:cache:sentence_spelling:*"


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class SentencePayload(BaseModel):
    text_kh: str
    text_en: str | None = None
    is_active: bool = True


# ── Helpers ──────────────────────────────────────────────────────────────────

def _sentence_detail(sentence: SentenceSpellingSentence) -> dict:
    return {
        "id": sentence.id,
        "text_kh": sentence.text_kh,
        "text_en": sentence.text_en,
        "is_active": sentence.is_active,
        "created_at": sentence.created_at.isoformat() if sentence.created_at else None,
        "updated_at": sentence.updated_at.isoformat() if sentence.updated_at else None,
    }


@router.get("/sentences")
def list_sentences(
    page: int = 1,
    size: int = 20,
    search: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """List sentences with pagination and optional search."""
    cache_key = f"ksl:cache:sentence_spelling:p{page}:s{size}:q{search or ''}"
    cached = cache_get(rc, cache_key)
    if cached is not None:
        return cached

    query = db.query(SentenceSpellingSentence)

    if search:
        query = query.filter(
            SentenceSpellingSentence.text_kh.ilike(f"%{search}%")
            | SentenceSpellingSentence.text_en.ilike(f"%{search}%")
        )

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size

    sentences = (
        query.order_by(SentenceSpellingSentence.id.asc()).offset(offset).limit(size).all()
    )

    result = {
        "items": [_sentence_detail(s) for s in sentences],
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }
    cache_set(rc, cache_key, result, ttl=300)  # 5 min TTL
    return result


@router.get("/sentences/{sentence_id}")
def get_sentence(
    sentence_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Get a single sentence by ID."""
    sentence = db.get(SentenceSpellingSentence, sentence_id)
    if not sentence:
        raise HTTPException(status_code=404, detail="Sentence not found")
    return _sentence_detail(sentence)


@router.post("/sentences", status_code=201)
def create_sentence(
    body: SentencePayload,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Create a new sentence."""
    sentence = SentenceSpellingSentence(
        text_kh=body.text_kh,
        text_en=body.text_en,
        is_active=body.is_active,
    )
    db.add(sentence)
    db.commit()
    db.refresh(sentence)
    cache_invalidate_pattern(rc, _CACHE_PATTERN)
    return _sentence_detail(sentence)


@router.put("/sentences/{sentence_id}")
def update_sentence(
    sentence_id: int,
    body: SentencePayload,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Update an existing sentence."""
    sentence = db.get(SentenceSpellingSentence, sentence_id)
    if not sentence:
        raise HTTPException(status_code=404, detail="Sentence not found")

    sentence.text_kh = body.text_kh
    sentence.text_en = body.text_en
    sentence.is_active = body.is_active

    db.commit()
    db.refresh(sentence)
    cache_invalidate_pattern(rc, _CACHE_PATTERN)
    return _sentence_detail(sentence)


@router.delete("/sentences/{sentence_id}", status_code=204)
def delete_sentence(
    sentence_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Delete a sentence. Practice attempt history keeps its own denormalized
    ``practiced_text`` copy, so deleting the sentence row does not lose it."""
    sentence = db.get(SentenceSpellingSentence, sentence_id)
    if not sentence:
        raise HTTPException(status_code=404, detail="Sentence not found")
    db.delete(sentence)
    db.commit()
    cache_invalidate_pattern(rc, _CACHE_PATTERN)
