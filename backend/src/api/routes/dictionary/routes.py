"""Dictionary browse endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import redis as redis_lib

from src.api.deps import get_db
from src.core.cache import cache_get, cache_set
from src.core.redis import get_redis
from src.schemas.dictionary import DictionaryEntryResponse, DictionaryListResponse
from src.services.dictionary import DictionaryService
from src.services.dictionary.dictionary_service import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

router = APIRouter(prefix="/api/dictionary", tags=["dictionary"])

_VALID_ENTRY_TYPES = {"all", "character", "word"}
_VALID_SORT = {"default", "az", "za"}


@router.get("", response_model=DictionaryListResponse)
def list_dictionary_entries(
    search: str | None = Query(default=None),
    entry_type: str | None = Query(default=None),
    sort: str = Query(default="default"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    db: Session = Depends(get_db),
    rc: redis_lib.Redis = Depends(get_redis),
) -> DictionaryListResponse:
    normalized_type = (entry_type or "all").strip().lower()
    if normalized_type not in _VALID_ENTRY_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"entry_type must be one of: {', '.join(sorted(_VALID_ENTRY_TYPES))}",
        )

    normalized_sort = (sort or "default").strip().lower()
    if normalized_sort not in _VALID_SORT:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"sort must be one of: {', '.join(sorted(_VALID_SORT))}",
        )

    # Cache public dictionary responses (no user context — same for everyone)
    cache_key = f"ksl:cache:public:dict:t{normalized_type}:s{normalized_sort}:p{page}:ps{page_size}:q{search or ''}"
    cached = cache_get(rc, cache_key)
    if cached is not None:
        return DictionaryListResponse(**cached)

    service = DictionaryService(db)
    result = service.list_entries(
        search=search,
        entry_type=normalized_type,
        sort=normalized_sort,
        page=page,
        page_size=page_size,
    )

    # Cache for 15 minutes — dictionary content rarely changes
    cache_set(rc, cache_key, result.model_dump(mode="json"), ttl=900)
    return result


@router.get("/{entry_id}", response_model=DictionaryEntryResponse)
def get_dictionary_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    rc: redis_lib.Redis = Depends(get_redis),
) -> DictionaryEntryResponse:
    cache_key = f"ksl:cache:public:dict:entry:{entry_id}"
    cached = cache_get(rc, cache_key)
    if cached is not None:
        return DictionaryEntryResponse(**cached)

    service = DictionaryService(db)
    entry = service.get_entry(entry_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    cache_set(rc, cache_key, entry.model_dump(mode="json"), ttl=900)
    return entry
