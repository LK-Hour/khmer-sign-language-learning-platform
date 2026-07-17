"""Admin curriculum routes (track-parameterized, centralized).

Single admin role; every endpoint requires ``account_type=admin``.

Lifecycle contract:
- POST / PUT save changes as ``draft`` (not learner-visible).
- POST ``/{id}/publish`` is the explicit confirm action that makes a row live.
- DELETE soft-deletes (``is_active=false``); POST ``/{id}/restore`` reactivates.

    /api/admin/{track}/units                 GET  POST
    /api/admin/{track}/units/{id}            GET  PUT  DELETE
    /api/admin/{track}/units/{id}/restore    POST
    /api/admin/{track}/units/{id}/publish    POST
    (same shape for /chapters and /lessons)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import redis as redis_lib

from src.api.deps import get_admin_user, get_db
from src.core.cache import cache_get, cache_invalidate_pattern, cache_set
from src.core.redis import get_redis
from src.models.user import User
from src.schemas.admin.curriculum import (
    ChapterCreate,
    ChapterResponse,
    ChapterUpdate,
    LessonCreate,
    LessonResponse,
    LessonUpdate,
    UnitCreate,
    UnitResponse,
    UnitUpdate,
)
from src.services.admin.curriculum_admin_service import CurriculumAdminService

router = APIRouter(
    prefix="/api/admin/{track}",
    tags=["admin-curriculum"],
)


def _svc(track: str, db: Session) -> CurriculumAdminService:
    return CurriculumAdminService(db, track)


def _found(result, entity: str):
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{entity} not found")
    return result


def _invalidate_curriculum_cache(rc: redis_lib.Redis, track: str) -> None:
    """Invalidate all curriculum cache for a given track (admin + public)."""
    # Admin cache
    cache_invalidate_pattern(rc, f"ksl:cache:curriculum:{track}:*")
    # Public learner cache (guest units/chapters/lessons)
    prefix = "fs" if track == "finger" else "wd"
    cache_invalidate_pattern(rc, f"ksl:cache:public:{prefix}:*")
    # Public dictionary & letter caches (letters are linked to curriculum)
    cache_invalidate_pattern(rc, "ksl:cache:public:dict:*")
    cache_invalidate_pattern(rc, "ksl:cache:public:letter:*")


# ── Units ────────────────────────────────────────────────────────────────────


@router.get("/units", response_model=list[UnitResponse])
def list_units(
    track: str,
    active_only: bool = Query(False),
    publish_status: str | None = Query(None, alias="status"),
    q: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    # Cache only unfiltered requests (most common from admin panel)
    cache_key = None
    if not active_only and not publish_status and not q:
        cache_key = f"ksl:cache:curriculum:{track}:units"
        cached = cache_get(rc, cache_key)
        if cached is not None:
            return cached

    result = _svc(track, db).list_units(active_only=active_only, status=publish_status, q=q)

    if cache_key and result is not None:
        # Serialize Pydantic models for cache
        serialized = [UnitResponse.model_validate(r).model_dump(mode="json") for r in result]
        cache_set(rc, cache_key, serialized, ttl=600)
        return serialized

    return result


@router.post("/units", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
def create_unit(
    track: str,
    body: UnitCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _svc(track, db).create_unit(body)
    _invalidate_curriculum_cache(rc, track)
    return result


@router.get("/units/{unit_id}", response_model=UnitResponse)
def get_unit(
    track: str,
    unit_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).get_unit(unit_id), "Unit")


@router.put("/units/{unit_id}", response_model=UnitResponse)
def update_unit(
    track: str,
    unit_id: int,
    body: UnitUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _found(_svc(track, db).update_unit(unit_id, body), "Unit")
    _invalidate_curriculum_cache(rc, track)
    return result


@router.delete("/units/{unit_id}", response_model=UnitResponse)
def soft_delete_unit(
    track: str,
    unit_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _found(_svc(track, db).soft_delete_unit(unit_id), "Unit")
    _invalidate_curriculum_cache(rc, track)
    return result


@router.post("/units/{unit_id}/restore", response_model=UnitResponse)
def restore_unit(
    track: str,
    unit_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _found(_svc(track, db).restore_unit(unit_id), "Unit")
    _invalidate_curriculum_cache(rc, track)
    return result


@router.post("/units/{unit_id}/publish", response_model=UnitResponse)
def publish_unit(
    track: str,
    unit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    try:
        result = _found(_svc(track, db).publish_unit(unit_id, user.id), "Unit")
        _invalidate_curriculum_cache(rc, track)
        return result
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc


# ── Chapters ─────────────────────────────────────────────────────────────────


@router.get("/chapters", response_model=list[ChapterResponse])
def list_chapters(
    track: str,
    unit_id: int | None = Query(None),
    active_only: bool = Query(False),
    publish_status: str | None = Query(None, alias="status"),
    q: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    cache_key = None
    if not active_only and not publish_status and not q:
        cache_key = f"ksl:cache:curriculum:{track}:chapters:{unit_id or 'all'}"
        cached = cache_get(rc, cache_key)
        if cached is not None:
            return cached

    result = _svc(track, db).list_chapters(
        unit_id=unit_id, active_only=active_only, status=publish_status, q=q
    )

    if cache_key and result is not None:
        serialized = [ChapterResponse.model_validate(r).model_dump(mode="json") for r in result]
        cache_set(rc, cache_key, serialized, ttl=600)
        return serialized

    return result


@router.post("/chapters", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
def create_chapter(
    track: str,
    body: ChapterCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _found(_svc(track, db).create_chapter(body), "Parent unit")
    _invalidate_curriculum_cache(rc, track)
    return result


@router.get("/chapters/{chapter_id}", response_model=ChapterResponse)
def get_chapter(
    track: str,
    chapter_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).get_chapter(chapter_id), "Chapter")


@router.put("/chapters/{chapter_id}", response_model=ChapterResponse)
def update_chapter(
    track: str,
    chapter_id: int,
    body: ChapterUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _found(_svc(track, db).update_chapter(chapter_id, body), "Chapter")
    _invalidate_curriculum_cache(rc, track)
    return result


@router.delete("/chapters/{chapter_id}", response_model=ChapterResponse)
def soft_delete_chapter(
    track: str,
    chapter_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _found(_svc(track, db).soft_delete_chapter(chapter_id), "Chapter")
    _invalidate_curriculum_cache(rc, track)
    return result


@router.post("/chapters/{chapter_id}/restore", response_model=ChapterResponse)
def restore_chapter(
    track: str,
    chapter_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _found(_svc(track, db).restore_chapter(chapter_id), "Chapter")
    _invalidate_curriculum_cache(rc, track)
    return result


@router.post("/chapters/{chapter_id}/publish", response_model=ChapterResponse)
def publish_chapter(
    track: str,
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    try:
        result = _found(_svc(track, db).publish_chapter(chapter_id, user.id), "Chapter")
        _invalidate_curriculum_cache(rc, track)
        return result
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc


# ── Lessons ──────────────────────────────────────────────────────────────────


@router.get("/lessons", response_model=list[LessonResponse])
def list_lessons(
    track: str,
    chapter_id: int | None = Query(None),
    active_only: bool = Query(False),
    publish_status: str | None = Query(None, alias="status"),
    q: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    cache_key = None
    if not active_only and not publish_status and not q:
        cache_key = f"ksl:cache:curriculum:{track}:lessons:{chapter_id or 'all'}"
        cached = cache_get(rc, cache_key)
        if cached is not None:
            return cached

    result = _svc(track, db).list_lessons(
        chapter_id=chapter_id, active_only=active_only, status=publish_status, q=q
    )

    if cache_key and result is not None:
        serialized = [LessonResponse.model_validate(r).model_dump(mode="json") for r in result]
        cache_set(rc, cache_key, serialized, ttl=600)
        return serialized

    return result


@router.post("/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(
    track: str,
    body: LessonCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _found(_svc(track, db).create_lesson(body), "Parent chapter")
    _invalidate_curriculum_cache(rc, track)
    return result


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    track: str,
    lesson_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _found(_svc(track, db).get_lesson(lesson_id), "Lesson")


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    track: str,
    lesson_id: int,
    body: LessonUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _found(_svc(track, db).update_lesson(lesson_id, body), "Lesson")
    _invalidate_curriculum_cache(rc, track)
    return result


@router.delete("/lessons/{lesson_id}", response_model=LessonResponse)
def soft_delete_lesson(
    track: str,
    lesson_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _found(_svc(track, db).soft_delete_lesson(lesson_id), "Lesson")
    _invalidate_curriculum_cache(rc, track)
    return result


@router.post("/lessons/{lesson_id}/restore", response_model=LessonResponse)
def restore_lesson(
    track: str,
    lesson_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    result = _found(_svc(track, db).restore_lesson(lesson_id), "Lesson")
    _invalidate_curriculum_cache(rc, track)
    return result


@router.post("/lessons/{lesson_id}/publish", response_model=LessonResponse)
def publish_lesson(
    track: str,
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    try:
        result = _found(_svc(track, db).publish_lesson(lesson_id, user.id), "Lesson")
        _invalidate_curriculum_cache(rc, track)
        return result
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc


# ── Lesson Junction Endpoints (letters for finger, words for word_detection) ──


@router.get("/lessons/{lesson_id}/letters")
def get_lesson_letters(
    track: str,
    lesson_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Get letters associated with a finger-spelling lesson (junction table)."""
    from src.models.finger_spelling import FingerLessonLetter, FingerLetter

    rows = (
        db.query(FingerLessonLetter)
        .filter(FingerLessonLetter.lesson_id == lesson_id)
        .order_by(FingerLessonLetter.order_index)
        .all()
    )
    result = []
    for row in rows:
        letter = db.get(FingerLetter, row.letter_id)
        result.append({
            "id": row.id,
            "lesson_id": row.lesson_id,
            "letter_id": row.letter_id,
            "order_index": row.order_index,
            "letter": {
                "id": letter.id,
                "letter_en": letter.letter_en,
                "letter_kh": letter.letter_kh,
                "is_active": letter.is_active,
            } if letter else None,
        })
    return result


@router.post("/lessons/{lesson_id}/letters", status_code=201)
def add_lesson_letter(
    track: str,
    lesson_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Add a letter to a finger-spelling lesson."""
    from src.models.finger_spelling import FingerLessonLetter

    link = FingerLessonLetter(
        lesson_id=lesson_id,
        letter_id=body["letter_id"],
        order_index=body.get("order_index", 0),
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    _invalidate_curriculum_cache(rc, track)
    return {
        "id": link.id,
        "lesson_id": link.lesson_id,
        "letter_id": link.letter_id,
        "order_index": link.order_index,
    }


@router.delete("/lessons/{lesson_id}/letters/{letter_id}", status_code=204)
def remove_lesson_letter(
    track: str,
    lesson_id: int,
    letter_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Remove a letter from a finger-spelling lesson."""
    from src.models.finger_spelling import FingerLessonLetter

    link = (
        db.query(FingerLessonLetter)
        .filter(FingerLessonLetter.lesson_id == lesson_id, FingerLessonLetter.letter_id == letter_id)
        .first()
    )
    if link:
        db.delete(link)
        db.commit()
        _invalidate_curriculum_cache(rc, track)


@router.get("/lessons/{lesson_id}/words")
def get_lesson_words(
    track: str,
    lesson_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Get words associated with a word-detection lesson (junction table)."""
    from src.models.word_detection import WordDetectionLessonWord, WordDetectionWord

    rows = (
        db.query(WordDetectionLessonWord)
        .filter(WordDetectionLessonWord.lesson_id == lesson_id)
        .order_by(WordDetectionLessonWord.order_index)
        .all()
    )
    result = []
    for row in rows:
        word = db.get(WordDetectionWord, row.word_id)
        result.append({
            "id": row.id,
            "lesson_id": row.lesson_id,
            "word_id": row.word_id,
            "order_index": row.order_index,
            "word": {
                "id": word.id,
                "word_en": word.word_en,
                "word_kh": word.word_kh,
                "is_active": word.is_active,
            } if word else None,
        })
    return result


@router.post("/lessons/{lesson_id}/words", status_code=201)
def add_lesson_word(
    track: str,
    lesson_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Add a word to a word-detection lesson."""
    from src.models.word_detection import WordDetectionLessonWord

    link = WordDetectionLessonWord(
        lesson_id=lesson_id,
        word_id=body["word_id"],
        order_index=body.get("order_index", 0),
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    _invalidate_curriculum_cache(rc, track)
    return {
        "id": link.id,
        "lesson_id": link.lesson_id,
        "word_id": link.word_id,
        "order_index": link.order_index,
    }


@router.delete("/lessons/{lesson_id}/words/{word_id}", status_code=204)
def remove_lesson_word(
    track: str,
    lesson_id: int,
    word_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Remove a word from a word-detection lesson."""
    from src.models.word_detection import WordDetectionLessonWord

    link = (
        db.query(WordDetectionLessonWord)
        .filter(WordDetectionLessonWord.lesson_id == lesson_id, WordDetectionLessonWord.word_id == word_id)
        .first()
    )
    if link:
        db.delete(link)
        db.commit()
        _invalidate_curriculum_cache(rc, track)
