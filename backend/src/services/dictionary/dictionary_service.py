"""Business logic for dictionary browse (finger-spelling characters today)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from src.repositories.dictionary.dictionary_repository import (
    DictionaryEntryRow,
    DictionaryRepository,
)
from src.schemas.dictionary import DictionaryEntryResponse, DictionaryListResponse
from src.repositories.dictionary.dictionary_order import (
    khmer_character_sort_key,
    sort_dictionary_rows,
)

DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 500


class DictionaryService:
    def __init__(self, db: Session) -> None:
        self.repository = DictionaryRepository(db)

    def list_entries(
        self,
        search: str | None = None,
        entry_type: str | None = None,
        sort: str = "default",
        page: int = 1,
        page_size: int = DEFAULT_PAGE_SIZE,
        *,
        active_only: bool = True,
    ) -> DictionaryListResponse:
        rows = self.repository.list_entry_rows(active_only=active_only)
        sorted_rows = sort_dictionary_rows(rows)

        character_count = sum(
            1 for row in sorted_rows if self._entry_type(row) == "character"
        )
        word_count = sum(
            1 for row in sorted_rows if self._entry_type(row) == "word"
        )

        query = (search or "").strip().lower()
        filtered_rows = sorted_rows

        if query:
            filtered_rows = [
                row for row in filtered_rows if self._matches_query(row, query)
            ]

        normalized_type = (entry_type or "all").strip().lower()
        if normalized_type not in ("all", ""):
            filtered_rows = [
                row
                for row in filtered_rows
                if self._entry_type(row) == normalized_type
            ]

        filtered_rows = self._sort_rows(filtered_rows, sort)

        safe_page = max(1, page)
        safe_page_size = min(max(1, page_size), MAX_PAGE_SIZE)
        total = len(filtered_rows)
        start = (safe_page - 1) * safe_page_size
        page_rows = filtered_rows[start : start + safe_page_size]

        items = [self.to_entry_response(row) for row in page_rows]
        return DictionaryListResponse(
            items=items,
            total=total,
            page=safe_page,
            page_size=safe_page_size,
            character_count=character_count,
            word_count=word_count,
        )

    def get_entry(
        self, entry_id: int, *, active_only: bool = True
    ) -> DictionaryEntryResponse | None:
        row = self.repository.get_entry_row(entry_id, active_only=active_only)
        if row is None:
            return None
        return self.to_entry_response(row)

    @staticmethod
    def _entry_type(_row: DictionaryEntryRow) -> str:
        return "character"

    @classmethod
    def _sort_rows(cls, rows: list[DictionaryEntryRow], sort: str) -> list[DictionaryEntryRow]:
        normalized_sort = (sort or "default").strip().lower()
        if normalized_sort == "az":
            return sorted(rows, key=khmer_character_sort_key)
        if normalized_sort == "za":
            return sorted(rows, key=khmer_character_sort_key, reverse=True)
        return sort_dictionary_rows(rows)

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
