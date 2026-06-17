"""Dictionary browse endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.schemas.dictionary import DictionaryEntryResponse, DictionaryListResponse
from src.services.dictionary import DictionaryService

router = APIRouter(prefix="/api/dictionary", tags=["dictionary"])


@router.get("", response_model=DictionaryListResponse)
def list_dictionary_entries(
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> DictionaryListResponse:
    service = DictionaryService(db)
    return service.list_entries(search)


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
