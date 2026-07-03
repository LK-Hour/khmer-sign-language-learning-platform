"""Data access for dictionary entries (finger-spelling characters + word detection words)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models.finger_spelling import FingerLesson, FingerLetter, FingerUnit
from src.models.media import Media
from src.models.word_detection import WordDetectionLesson, WordDetectionUnit, WordDetectionWord
from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.repositories.word_detection.word_detection_curriculum_repository import (
    WordDetectionCurriculumRepository,
)
from src.repositories.dictionary.dictionary_order import (
    build_word_dictionary_id_maps,
    dictionary_unit_rank,
    pick_primary_lesson_path,
    pick_primary_word_lesson_path,
    sort_dictionary_rows,
    word_detection_unit_rank,
    word_id_from_dictionary_entry_id,
)


@dataclass
class DictionaryEntryRow:
    entry_type: Literal["character", "word"]
    dictionary_id: int
    letter: FingerLetter | None = None
    word: WordDetectionWord | None = None
    media: Media | None = None
    unit: FingerUnit | WordDetectionUnit | None = None
    lesson: FingerLesson | WordDetectionLesson | None = None
    lesson_order: int = 9999
    level: int | None = None


class DictionaryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db
        self._finger = FingerCurriculumRepository(db)
        self._word_detection = WordDetectionCurriculumRepository(db)

    def list_all_letters(self, *, active_only: bool = True) -> list[FingerLetter]:
        stmt = select(FingerLetter)
        if active_only:
            stmt = stmt.where(FingerLetter.is_active.is_(True))
        return list(self.db.scalars(stmt).all())

    def max_letter_id(self, *, active_only: bool = True) -> int:
        stmt = select(func.max(FingerLetter.id))
        if active_only:
            stmt = stmt.where(FingerLetter.is_active.is_(True))
        return int(self.db.scalar(stmt) or 0)

    def _build_word_id_maps(
        self, *, active_only: bool = True
    ) -> tuple[dict[int, int], dict[int, int]]:
        word_rows = [
            self._build_word_entry_row(word, dictionary_id=0, active_only=active_only)
            for word in self._word_detection.list_all_words(active_only=active_only)
        ]
        return build_word_dictionary_id_maps(word_rows, self.max_letter_id(active_only=active_only))

    def get_entry_row(
        self, entry_id: int, *, active_only: bool = True
    ) -> DictionaryEntryRow | None:
        letter = self._finger.get_letter_by_id(entry_id, active_only=active_only)
        if letter is not None:
            return self._build_character_entry_row(letter)

        _word_to_dict, dict_to_word = self._build_word_id_maps(active_only=active_only)
        word_id = word_id_from_dictionary_entry_id(entry_id, dict_to_word)
        if word_id is None:
            return None

        word = self._word_detection.get_word_by_id(word_id, active_only=active_only)
        if word is None:
            return None
        return self._build_word_entry_row(
            word,
            dictionary_id=entry_id,
            active_only=active_only,
        )

    def list_entry_rows(self, *, active_only: bool = True) -> list[DictionaryEntryRow]:
        character_rows = [
            self._build_character_entry_row(letter)
            for letter in self.list_all_letters(active_only=active_only)
        ]
        word_rows = [
            self._build_word_entry_row(word, dictionary_id=0, active_only=active_only)
            for word in self._word_detection.list_all_words(active_only=active_only)
        ]
        word_to_dict, _ = build_word_dictionary_id_maps(
            word_rows, self.max_letter_id(active_only=active_only)
        )
        for row in word_rows:
            if row.word is not None:
                row.dictionary_id = word_to_dict[row.word.id]

        return sort_dictionary_rows(character_rows + word_rows)

    def _build_character_entry_row(self, letter: FingerLetter) -> DictionaryEntryRow:
        medias = self._finger.list_medias_for_letter(letter.id)
        media = medias[0] if medias else None
        paths = self._finger.list_lesson_paths_for_letter(letter.id)
        lesson, unit = pick_primary_lesson_path(paths)
        level = None
        if paths:
            _, chapter, _ = min(
                paths,
                key=lambda path: (dictionary_unit_rank(path[2]), path[0].order_index),
            )
            level = int(chapter.order_index)
        return DictionaryEntryRow(
            entry_type="character",
            dictionary_id=letter.id,
            letter=letter,
            media=media,
            unit=unit,
            lesson=lesson,
            level=level,
        )

    def _build_word_entry_row(
        self,
        word: WordDetectionWord,
        *,
        dictionary_id: int,
        active_only: bool = True,
    ) -> DictionaryEntryRow:
        medias = self._word_detection.list_medias_for_word(word.id)
        media = medias[0] if medias else None
        paths = self._word_detection.list_lesson_paths_for_word(
            word.id, active_only=active_only
        )
        lesson, unit, lesson_order = pick_primary_word_lesson_path(paths)
        level = None
        if paths:
            _, chapter, _ = min(
                paths,
                key=lambda path: (
                    word_detection_unit_rank(path[2]),
                    path[1].order_index,
                    path[0].order_index,
                ),
            )
            level = int(chapter.level)
        return DictionaryEntryRow(
            entry_type="word",
            dictionary_id=dictionary_id,
            word=word,
            media=media,
            unit=unit,
            lesson=lesson,
            lesson_order=lesson_order,
            level=level,
        )
