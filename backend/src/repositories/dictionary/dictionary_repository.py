"""Data access for dictionary entries sourced from finger-spelling letters."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.finger_spelling import FingerLesson, FingerLetter, FingerUnit
from src.models.media import Media
from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.repositories.dictionary.dictionary_order import pick_primary_lesson_path


@dataclass
class DictionaryEntryRow:
    letter: FingerLetter
    media: Media | None
    unit: FingerUnit | None
    lesson: FingerLesson | None = None


class DictionaryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db
        self._curriculum = FingerCurriculumRepository(db)

    def list_all_letters(self, *, active_only: bool = True) -> list[FingerLetter]:
        stmt = select(FingerLetter)
        if active_only:
            stmt = stmt.where(FingerLetter.is_active.is_(True))
        return list(self.db.scalars(stmt).all())

    def get_entry_row(
        self, letter_id: int, *, active_only: bool = True
    ) -> DictionaryEntryRow | None:
        letter = self._curriculum.get_letter_by_id(letter_id, active_only=active_only)
        if letter is None:
            return None
        return self._build_entry_row(letter, active_only=active_only)

    def list_entry_rows(self, *, active_only: bool = True) -> list[DictionaryEntryRow]:
        return [
            self._build_entry_row(letter, active_only=active_only)
            for letter in self.list_all_letters(active_only=active_only)
        ]

    def _build_entry_row(
        self, letter: FingerLetter, *, active_only: bool = True
    ) -> DictionaryEntryRow:
        medias = self._curriculum.list_medias_for_letter(letter.id)
        media = medias[0] if medias else None
        paths = self._curriculum.list_lesson_paths_for_letter(
            letter.id, active_only=active_only
        )
        lesson, unit = pick_primary_lesson_path(paths)
        return DictionaryEntryRow(
            letter=letter,
            media=media,
            unit=unit,
            lesson=lesson,
        )
