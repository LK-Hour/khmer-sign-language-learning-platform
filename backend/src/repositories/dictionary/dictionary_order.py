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
    "Main Consonants": 1,
    "Sub Consonants": 2,
    "Dependent Vowels": 3,
    "Independent Vowels": 4,
    "Diacritics": 5,
}

_UNKNOWN_UNIT_RANK = 99


def dictionary_unit_rank(unit: FingerUnit | None) -> int:
    if unit is None:
        return _UNKNOWN_UNIT_RANK
    return DICTIONARY_UNIT_ORDER.get(unit.name_en, _UNKNOWN_UNIT_RANK)


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
    return (
        dictionary_unit_rank(row.unit),
        dictionary_lesson_order(row.lesson),
        row.letter.letter_kh,
    )


def sort_dictionary_rows(rows: list) -> list:
    return sorted(rows, key=dictionary_sort_key)
