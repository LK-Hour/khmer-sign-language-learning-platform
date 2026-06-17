"""Business logic for dictionary browse (finger-spelling characters today)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from src.repositories.dictionary.dictionary_repository import (
    DictionaryEntryRow,
    DictionaryRepository,
)
from src.schemas.dictionary import DictionaryEntryResponse, DictionaryListResponse
from src.repositories.dictionary.dictionary_order import sort_dictionary_rows


class DictionaryService:
    def __init__(self, db: Session) -> None:
        self.repository = DictionaryRepository(db)

    def list_entries(
        self, search: str | None = None, *, active_only: bool = True
    ) -> DictionaryListResponse:
        query = (search or "").strip().lower()
        rows = self.repository.list_entry_rows(active_only=active_only)

        if query:
            rows = [row for row in rows if self._matches_query(row, query)]

        rows = sort_dictionary_rows(rows)

        items = [self.to_entry_response(row) for row in rows]
        return DictionaryListResponse(items=items, total=len(items))

    def get_entry(
        self, entry_id: int, *, active_only: bool = True
    ) -> DictionaryEntryResponse | None:
        row = self.repository.get_entry_row(entry_id, active_only=active_only)
        if row is None:
            return None
        return self.to_entry_response(row)

    @staticmethod
    def to_entry_response(row: DictionaryEntryRow) -> DictionaryEntryResponse:
        letter = row.letter
        unit = row.unit
        text_en = (letter.letter_en or letter.letter_kh or "").strip()
        description = (
            letter.description_en
            or letter.description_kh
            or (unit.name_en if unit else None)
        )

        return DictionaryEntryResponse(
            id=letter.id,
            text_en=text_en,
            text_kh=letter.letter_kh,
            media_url=row.media.file_url if row.media else None,
            video_url=None,
            category=unit.name_en if unit else None,
            entry_type="character",
            description=description,
            lesson_id=row.lesson.id if row.lesson else None,
        )

    @staticmethod
    def _matches_query(row: DictionaryEntryRow, query: str) -> bool:
        letter = row.letter
        unit = row.unit
        fields = (
            letter.letter_en,
            letter.letter_kh,
            letter.description_en,
            letter.description_kh,
            unit.name_en if unit else None,
            unit.name_kh if unit else None,
        )
        return any(query in (value or "").lower() for value in fields)
