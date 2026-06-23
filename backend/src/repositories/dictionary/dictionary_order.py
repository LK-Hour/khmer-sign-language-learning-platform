"""Khmer dictionary ordering for finger-spelling character groups."""

from __future__ import annotations

from src.models.finger_spelling import (
    FingerChapter,
    FingerLesson,
    FingerUnit,
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


def dictionary_sort_key(row) -> tuple[int, int, str]:
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
