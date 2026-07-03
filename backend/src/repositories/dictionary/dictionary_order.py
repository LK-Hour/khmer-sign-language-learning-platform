"""Khmer dictionary ordering for finger-spelling character groups and word detection."""

from __future__ import annotations

from src.models.finger_spelling import (
    FingerChapter,
    FingerLesson,
    FingerUnit,
)
from src.models.word_detection import (
    WordDetectionChapter,
    WordDetectionLesson,
    WordDetectionUnit,
)

# Dictionary browse order (differs from finger-spelling lesson track order).
DICTIONARY_UNIT_ORDER: dict[str, int] = {
    "Numbers": 0,
    "Dependent Vowels": 1,
    "Main Consonants": 2,
    "Sub Consonants": 3,
    "Independent Vowels": 4,
    "Diacritics": 5,
}

# Word detection units — keep in sync with seed_data/seed_word_detection.py order.
WORD_DETECTION_UNIT_ORDER: dict[str, int] = {
    "Education": 100,
    "Directions and Places": 101,
    "Time": 102,
    "Pronouns and Nouns": 103,
    "Daily Activities": 104,
    "Food and Drinks": 105,
    "Household Items": 106,
    "Vehicles": 107,
    "Sports": 108,
}

# Word dictionary ids continue immediately after the highest active finger letter id.
# Example: letters 1..127 → first word is 128, second is 129, etc.

# Khmer teaching order within each unit — keep in sync with seed_data/seed_curriculum.py
UNIT_LETTER_ORDERS: dict[str, list[str]] = {
    "Numbers": ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"],
    "Dependent Vowels": [
        "ា", "ិ", "ី", "ឹ", "ឺ", "ុ", "ូ", "ួ", "ើ", "ឿ", "ៀ", "េ", "ែ", "ៃ",
        "ោ", "ៅ", "ុំ", "ំ", "ាំ", "ះ", "ុះ", "េះ", "ោះ",
    ],
    "Main Consonants": [
        "ក", "ខ", "គ", "ឃ", "ង", "ច", "ឆ", "ជ", "ឈ", "ញ", "ដ", "ឋ", "ឌ", "ឍ",
        "ណ", "ត", "ថ", "ទ", "ធ", "ន", "ប", "ផ", "ព", "ភ", "ម", "យ", "រ", "ល",
        "វ", "ស", "ហ", "ឡ", "អ",
    ],
    "Sub Consonants": [
        "្ក", "្ខ", "្គ", "្ឃ", "្ង", "្ច", "្ឆ", "្ជ", "្ឈ", "្ញ", "្ដ", "្ឋ",
        "្ឌ", "្ឍ", "្ណ", "្ត", "្ថ", "្ទ", "្ធ", "្ន", "្ប", "្ផ", "្ព", "្ភ",
        "្ម", "្យ", "្រ", "្ល", "្វ", "្ស", "្ហ", "្អ",
    ],
    "Independent Vowels": [
        "ឣ", "ឤ", "ឥ", "ឦ", "ឧ", "ឩ", "ឫ", "ឬ", "ឭ", "ឮ", "ឯ", "ឰ", "ឱ", "ឳ",
    ],
    "Diacritics": [
        "់", "៉", "៊", "៌", "៍", "៎", "៏", "័", "។", "។ល។", "៖", "ៗ", "៚", "!", "?",
    ],
}

_LETTER_INDEX: dict[tuple[str, str], int] = {
    (unit_name, letter): index
    for unit_name, letters in UNIT_LETTER_ORDERS.items()
    for index, letter in enumerate(letters)
}

_UNKNOWN_UNIT_RANK = 99
_UNKNOWN_LETTER_INDEX = 9999


def dictionary_unit_rank(unit: FingerUnit | None) -> int:
    if unit is None:
        return _UNKNOWN_UNIT_RANK
    return DICTIONARY_UNIT_ORDER.get(unit.name_en, _UNKNOWN_UNIT_RANK)


def dictionary_letter_index(unit: FingerUnit | None, letter_kh: str | None) -> int:
    if unit is None:
        return _UNKNOWN_LETTER_INDEX
    normalized = (letter_kh or "").strip()
    if not normalized:
        return _UNKNOWN_LETTER_INDEX
    return _LETTER_INDEX.get((unit.name_en, normalized), _UNKNOWN_LETTER_INDEX)


def dictionary_lesson_order(lesson: FingerLesson | None) -> int:
    if lesson is None:
        return _UNKNOWN_UNIT_RANK
    return lesson.order_index


def pick_primary_lesson_path(
    paths: list[tuple[FingerLesson, FingerChapter, FingerUnit]],
) -> tuple[FingerLesson | None, FingerUnit | None]:
    if not paths:
        return None, None

    lesson, _chapter, unit = min(
        paths,
        key=lambda path: (dictionary_unit_rank(path[2]), path[0].order_index),
    )
    return lesson, unit


def pick_primary_word_lesson_path(
    paths: list[tuple[WordDetectionLesson, WordDetectionChapter, WordDetectionUnit]],
) -> tuple[WordDetectionLesson | None, WordDetectionUnit | None, int]:
    if not paths:
        return None, None, _UNKNOWN_UNIT_RANK

    lesson, chapter, unit = min(
        paths,
        key=lambda path: (
            word_detection_unit_rank(path[2]),
            path[1].order_index,
            path[0].order_index,
        ),
    )
    lesson_order = (
        word_detection_unit_rank(unit) * 1000
        + chapter.order_index * 100
        + lesson.order_index
    )
    return lesson, unit, lesson_order


def word_detection_unit_rank(unit: WordDetectionUnit | None) -> int:
    if unit is None:
        return _UNKNOWN_UNIT_RANK
    return WORD_DETECTION_UNIT_ORDER.get(unit.name_en, _UNKNOWN_UNIT_RANK)


def build_word_dictionary_id_maps(
    word_rows: list,
    max_letter_id: int,
) -> tuple[dict[int, int], dict[int, int]]:
    """Map word_detection_words.id ↔ public dictionary id (after finger letters)."""
    sorted_rows = sorted(word_rows, key=dictionary_sort_key)
    word_id_to_dictionary_id: dict[int, int] = {}
    dictionary_id_to_word_id: dict[int, int] = {}

    for index, row in enumerate(sorted_rows, start=1):
        word = row.word
        if word is None:
            continue
        dictionary_id = max_letter_id + index
        word_id_to_dictionary_id[word.id] = dictionary_id
        dictionary_id_to_word_id[dictionary_id] = word.id

    return word_id_to_dictionary_id, dictionary_id_to_word_id


def dictionary_entry_id_for_word(
    word_id: int,
    word_id_to_dictionary_id: dict[int, int],
) -> int:
    return word_id_to_dictionary_id[word_id]


def word_id_from_dictionary_entry_id(
    entry_id: int,
    dictionary_id_to_word_id: dict[int, int],
) -> int | None:
    return dictionary_id_to_word_id.get(entry_id)


def dictionary_sort_key(row) -> tuple[int, int, str]:
    if getattr(row, "entry_type", "character") == "word":
        unit = row.unit
        word_kh = row.word.word_kh if row.word else ""
        return (
            word_detection_unit_rank(unit),
            getattr(row, "lesson_order", _UNKNOWN_LETTER_INDEX),
            word_kh,
        )

    letter_kh = row.letter.letter_kh or ""
    return (
        dictionary_unit_rank(row.unit),
        dictionary_letter_index(row.unit, letter_kh),
        letter_kh,
    )


def sort_dictionary_rows(rows: list) -> list:
    return sorted(rows, key=dictionary_sort_key)


def khmer_character_sort_key(row) -> tuple[int, int, str]:
    """Khmer A–Z / Z–A: category order, then Khmer teaching order within each group."""
    return dictionary_sort_key(row)
