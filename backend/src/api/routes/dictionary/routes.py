"""Dictionary browse endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.deps import get_db
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

    service = DictionaryService(db)
    return service.list_entries(
        search=search,
        entry_type=normalized_type,
        sort=normalized_sort,
        page=page,
        page_size=page_size,
    )


@router.get("/{entry_id}", response_model=DictionaryEntryResponse)
def get_dictionary_entry(
    entry_id: int,
    db: Session = Depends(get_db),
) -> DictionaryEntryResponse:
    service = DictionaryService(db)
    entry = service.get_entry(entry_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return entry
