#!/usr/bin/env python3
"""
Generate a complete finger-spelling quiz dataset from seed_curriculum.py.

Run from the backend directory:
    python seed_data/generate_quiz_dataset.py
    python seed_data/generate_quiz_dataset.py --seed          # insert into DB
    python seed_data/generate_quiz_dataset.py --wipe --seed   # replace exercises

Outputs:
    seed_data/quiz_dataset.json
    seed_data/quiz_questions.md
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from dotenv import load_dotenv

load_dotenv(BASE_DIR / ".env")


def _configure_stdio_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except (OSError, ValueError, AttributeError):
                pass


# Import authoritative curriculum source (same folder as this script)
SEED_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SEED_DIR))
import seed_curriculum  # noqa: E402

DEPENDENT_VOWELS = seed_curriculum.DEPENDENT_VOWELS
DIACRITICS = seed_curriculum.DIACRITICS
INDEPENDENT_VOWELS = seed_curriculum.INDEPENDENT_VOWELS
MAIN_CONSONANTS = seed_curriculum.MAIN_CONSONANTS
NUMBERS = seed_curriculum.NUMBERS
SUB_CONSONANTS = seed_curriculum.SUB_CONSONANTS
UNITS_META = seed_curriculum.UNITS_META
_build_curriculum = seed_curriculum._build_curriculum

EXPECTED_CATEGORIES = [
    "Numbers",
    "Dependent Vowels",
    "Main Consonants",
    "Sub Consonants",
    "Diacritics",
    "Independent Vowels",
]

CATEGORY_LETTER_LISTS: dict[str, list[tuple[str, str]]] = {
    "Dependent Vowels": DEPENDENT_VOWELS,
    "Main Consonants": MAIN_CONSONANTS,
    "Numbers": NUMBERS,
    "Sub Consonants": SUB_CONSONANTS,
    "Diacritics": DIACRITICS,
    "Independent Vowels": INDEPENDENT_VOWELS,
}

EXERCISE_TYPES = ("multiple_choice", "image_select", "free_form")
DISTRACTOR_OFFSETS = (1, 2, 3, 5, 7, 11, 13, 17)


@dataclass(frozen=True)
class CurriculumItem:
    letter_id: int
    lesson_id: int
    chapter_id: int
    unit_id: int
    unit_name_en: str
    unit_name_kh: str
    letter_kh: str
    letter_en: str
    index_in_unit: int
    primary_media_id: int | None = None


@dataclass
class GeneratedOption:
    id: int
    exercise_id: int
    option_text_en: str | None
    option_text_kh: str | None
    media_id: int | None
    is_correct: bool
    order_index: int
    image_ref: str | None = None


@dataclass
class GeneratedExercise:
    id: int
    lesson_id: int
    letter_id: int
    letter_kh: str
    letter_en: str
    unit_id: int
    unit_name_en: str
    exercise_type: str
    question_en: str
    question_kh: str
    media_id: int | None
    correct_answer: str | None
    order_index: int
    options: list[GeneratedOption] = field(default_factory=list)
    image_ref: str | None = None


@dataclass
class ValidationReport:
    curriculum_items: int = 0
    questions_generated: int = 0
    expected_questions: int = 0
    coverage_percent: float = 0.0
    missing_items: list[str] = field(default_factory=list)
    duplicate_questions: list[str] = field(default_factory=list)
    schema_errors: list[str] = field(default_factory=list)
    curriculum_warnings: list[str] = field(default_factory=list)
    coverage_status: str = "FAIL"
    validation_status: str = "FAIL"

    def to_dict(self) -> dict[str, Any]:
        return {
            "curriculum_items": self.curriculum_items,
            "questions_generated": self.questions_generated,
            "expected_questions": self.expected_questions,
            "coverage_percent": self.coverage_percent,
            "missing_items": self.missing_items,
            "duplicate_questions": self.duplicate_questions,
            "schema_errors": self.schema_errors,
            "curriculum_warnings": self.curriculum_warnings,
            "coverage_status": self.coverage_status,
            "validation_status": self.validation_status,
        }


def _deterministic_shuffle(items: list[Any], seed_key: str) -> list[Any]:
    """Stable shuffle using md5 digest — reproducible across runs."""
    if len(items) <= 1:
        return list(items)
    digest = hashlib.md5(seed_key.encode("utf-8")).hexdigest()
    keyed = [
        (int(digest[(idx * 2) % len(digest) : (idx * 2) % len(digest) + 2], 16), idx, item)
        for idx, item in enumerate(items)
    ]
    keyed.sort()
    return [item for _, _, item in keyed]


def _pick_distractor_indices(
    unit_size: int,
    target_index: int,
    count: int,
    salt: int = 0,
) -> list[int]:
    if unit_size <= count + 1:
        raise ValueError(f"Unit has {unit_size} items; need at least {count + 2} for distractors")

    chosen: list[int] = []
    used = {target_index}
    offset_i = salt

    while len(chosen) < count:
        step = DISTRACTOR_OFFSETS[offset_i % len(DISTRACTOR_OFFSETS)]
        candidate = (target_index + step + offset_i) % unit_size
        offset_i += 1
        if candidate in used:
            continue
        used.add(candidate)
        chosen.append(candidate)

    return chosen


def validate_curriculum_source() -> ValidationReport:
    report = ValidationReport()
    warnings: list[str] = []

    found_categories = [unit["name_en"] for unit in UNITS_META]
    for expected in EXPECTED_CATEGORIES:
        if expected not in found_categories:
            warnings.append(f"Missing expected category: {expected}")

    for unit in UNITS_META:
        letters = unit["letters"]
        kh_values = [kh for kh, _ in letters]
        en_values = [en for _, en in letters]

        if len(kh_values) != len(set(kh_values)):
            dupes = sorted({kh for kh in kh_values if kh_values.count(kh) > 1})
            warnings.append(f"Duplicate letter_kh in {unit['name_en']}: {dupes}")

        missing_rom = [kh for kh, en in letters if not en or not str(en).strip()]
        if missing_rom:
            warnings.append(f"Missing romanization in {unit['name_en']}: {missing_rom}")

        dup_en = sorted({en for en in en_values if en_values.count(en) > 1})
        if dup_en:
            warnings.append(
                f"Duplicate romanization in {unit['name_en']}: {dup_en} "
                "(acceptable for distinct Khmer glyphs)"
            )

        desc = unit.get("description_en", "")
        if "Dependent Vowels" in unit["name_en"] and "24" in desc and len(letters) == 23:
            warnings.append(
                "Dependent Vowels unit description claims 24 vowels but list contains 23 entries"
            )
        if "Main Consonants" in unit["name_en"] and len(letters) != 33:
            warnings.append(f"Main Consonants expected 33, found {len(letters)}")
        if "Numbers" in unit["name_en"] and len(letters) != 10:
            warnings.append(f"Numbers expected 10, found {len(letters)}")
        if "Sub Consonants" in unit["name_en"] and len(letters) != 32:
            warnings.append(f"Sub Consonants expected 32, found {len(letters)}")
        if "Diacritics" in unit["name_en"] and len(letters) != 15:
            warnings.append(f"Diacritics expected 15, found {len(letters)}")
        if "Independent Vowels" in unit["name_en"] and len(letters) != 14:
            warnings.append(f"Independent Vowels expected 14, found {len(letters)}")

    report.curriculum_warnings = warnings
    return report


def build_curriculum_items() -> list[CurriculumItem]:
    data = _build_curriculum()

    letter_by_id = {row["id"]: row for row in data["finger_letters"]}
    lesson_by_id = {row["id"]: row for row in data["finger_lessons"]}
    chapter_by_id = {row["id"]: row for row in data["finger_chapters"]}
    unit_by_id = {row["id"]: row for row in data["finger_units"]}

    lesson_to_letter: dict[int, int] = {}
    for link in data["finger_lesson_letters"]:
        lesson_to_letter[link["lesson_id"]] = link["letter_id"]

    letter_primary_media: dict[int, int | None] = {}
    for link in sorted(data["finger_letter_medias"], key=lambda row: row["id"]):
        letter_primary_media.setdefault(link["letter_id"], link["media_id"])

    unit_letter_order: dict[int, list[int]] = {unit["id"]: [] for unit in UNITS_META}

    items: list[CurriculumItem] = []
    for lesson_id in sorted(lesson_by_id):
        lesson = lesson_by_id[lesson_id]
        letter_id = lesson_to_letter[lesson_id]
        letter = letter_by_id[letter_id]
        chapter = chapter_by_id[lesson["chapter_id"]]
        unit = unit_by_id[chapter["unit_id"]]

        unit_letter_order[unit["id"]].append(letter_id)

        items.append(
            CurriculumItem(
                letter_id=letter_id,
                lesson_id=lesson_id,
                chapter_id=chapter["id"],
                unit_id=unit["id"],
                unit_name_en=unit["name_en"],
                unit_name_kh=unit["name_kh"],
                letter_kh=letter["letter_kh"],
                letter_en=letter["letter_en"] or "",
                index_in_unit=len(unit_letter_order[unit["id"]]) - 1,
                primary_media_id=letter_primary_media.get(letter_id),
            )
        )

    return items


def _image_ref(letter_id: int) -> str:
    return f"image_of_{letter_id}"


def _items_by_unit(items: list[CurriculumItem]) -> dict[int, list[CurriculumItem]]:
    grouped: dict[int, list[CurriculumItem]] = {}
    for item in items:
        grouped.setdefault(item.unit_id, []).append(item)
    return grouped


def generate_exercises(items: list[CurriculumItem]) -> tuple[list[GeneratedExercise], list[GeneratedOption]]:
    by_unit = _items_by_unit(items)
    exercises: list[GeneratedExercise] = []
    all_options: list[GeneratedOption] = []

    exercise_id = 1
    option_id = 1

    for item in items:
        unit_items = by_unit[item.unit_id]

        # ── 1. MULTIPLE CHOICE ──────────────────────────────────────────────
        distractor_indices = _pick_distractor_indices(
            len(unit_items), item.index_in_unit, 3, salt=item.letter_id
        )
        distractors = [unit_items[i] for i in distractor_indices]

        mc_choices = [
            (item.letter_kh, item.letter_en, True),
            *((d.letter_kh, d.letter_en, False) for d in distractors),
        ]
        mc_choices = _deterministic_shuffle(
            mc_choices, f"mc:{item.letter_id}:{item.lesson_id}"
        )

        mc_exercise = GeneratedExercise(
            id=exercise_id,
            lesson_id=item.lesson_id,
            letter_id=item.letter_id,
            letter_kh=item.letter_kh,
            letter_en=item.letter_en,
            unit_id=item.unit_id,
            unit_name_en=item.unit_name_en,
            exercise_type="multiple_choice",
            question_en="What is the character for this sign?",
            question_kh="តើអក្សរណាសម្រាប់សញ្ញានេះ?",
            media_id=item.primary_media_id,
            correct_answer=None,
            order_index=1,
            image_ref=_image_ref(item.letter_id),
        )

        for order_idx, (kh, en, is_correct) in enumerate(mc_choices, start=1):
            opt = GeneratedOption(
                id=option_id,
                exercise_id=exercise_id,
                option_text_en=en,
                option_text_kh=kh,
                media_id=None,
                is_correct=is_correct,
                order_index=order_idx,
            )
            mc_exercise.options.append(opt)
            all_options.append(opt)
            option_id += 1

        exercises.append(mc_exercise)
        exercise_id += 1

        # ── 2. IMAGE SELECTION ──────────────────────────────────────────────
        img_distractor_idx = _pick_distractor_indices(
            len(unit_items), item.index_in_unit, 1, salt=item.letter_id + 1000
        )[0]
        img_distractor = unit_items[img_distractor_idx]

        img_choices = [
            (item, True),
            (img_distractor, False),
        ]
        img_choices = _deterministic_shuffle(
            img_choices, f"img:{item.letter_id}:{item.lesson_id}"
        )

        img_exercise = GeneratedExercise(
            id=exercise_id,
            lesson_id=item.lesson_id,
            letter_id=item.letter_id,
            letter_kh=item.letter_kh,
            letter_en=item.letter_en,
            unit_id=item.unit_id,
            unit_name_en=item.unit_name_en,
            exercise_type="image_select",
            question_en=f'Which sign represents "{item.letter_kh}"?',
            question_kh=f'សញ្ញាណាដែលតំណាងអក្សរ "{item.letter_kh}"?',
            media_id=None,
            correct_answer=None,
            order_index=2,
        )

        for order_idx, (letter_item, is_correct) in enumerate(img_choices, start=1):
            opt = GeneratedOption(
                id=option_id,
                exercise_id=exercise_id,
                option_text_en=letter_item.letter_en,
                option_text_kh=letter_item.letter_kh,
                media_id=letter_item.primary_media_id,
                is_correct=is_correct,
                order_index=order_idx,
                image_ref=_image_ref(letter_item.letter_id),
            )
            img_exercise.options.append(opt)
            all_options.append(opt)
            option_id += 1

        exercises.append(img_exercise)
        exercise_id += 1

        # ── 3. FREE FORM ────────────────────────────────────────────────────
        ff_exercise = GeneratedExercise(
            id=exercise_id,
            lesson_id=item.lesson_id,
            letter_id=item.letter_id,
            letter_kh=item.letter_kh,
            letter_en=item.letter_en,
            unit_id=item.unit_id,
            unit_name_en=item.unit_name_en,
            exercise_type="free_form",
            question_en=f'Type the Khmer letter for "{item.letter_en}".',
            question_kh=f'វាយអក្សរខ្មែរសម្រាប់ "{item.letter_en}".',
            media_id=item.primary_media_id,
            correct_answer=item.letter_kh,
            order_index=3,
            image_ref=_image_ref(item.letter_id),
        )
        exercises.append(ff_exercise)
        exercise_id += 1

    return exercises, all_options


def validate_dataset(
    items: list[CurriculumItem],
    exercises: list[GeneratedExercise],
    source_report: ValidationReport,
) -> ValidationReport:
    report = ValidationReport()
    report.curriculum_warnings = list(source_report.curriculum_warnings)

    report.curriculum_items = len(items)
    report.questions_generated = len(exercises)
    report.expected_questions = len(items) * 3
    report.coverage_percent = (
        100.0
        if report.questions_generated == report.expected_questions
        else round(100.0 * report.questions_generated / max(report.expected_questions, 1), 2)
    )

    covered_letters = {ex.letter_id for ex in exercises}
    for item in items:
        if item.letter_id not in covered_letters:
            report.missing_items.append(f"{item.letter_kh} (id={item.letter_id})")

    per_letter_counts: dict[int, int] = {}
    per_letter_types: dict[int, set[str]] = {}
    for ex in exercises:
        per_letter_counts[ex.letter_id] = per_letter_counts.get(ex.letter_id, 0) + 1
        per_letter_types.setdefault(ex.letter_id, set()).add(ex.exercise_type)

    for item in items:
        if per_letter_counts.get(item.letter_id, 0) != 3:
            report.missing_items.append(
                f"{item.letter_kh}: expected 3 questions, got {per_letter_counts.get(item.letter_id, 0)}"
            )
        if per_letter_types.get(item.letter_id, set()) != set(EXERCISE_TYPES):
            report.missing_items.append(
                f"{item.letter_kh}: missing exercise type(s) "
                f"{set(EXERCISE_TYPES) - per_letter_types.get(item.letter_id, set())}"
            )

    signatures: dict[str, str] = {}
    for ex in exercises:
        sig = f"{ex.lesson_id}:{ex.exercise_type}:{ex.order_index}"
        if sig in signatures:
            report.duplicate_questions.append(sig)
        signatures[sig] = sig

    by_unit = _items_by_unit(items)
    for ex in exercises:
        if ex.exercise_type == "multiple_choice":
            if len(ex.options) != 4:
                report.schema_errors.append(
                    f"Exercise {ex.id} ({ex.letter_kh}): multiple_choice requires 4 options"
                )
            correct = [o for o in ex.options if o.is_correct]
            if len(correct) != 1:
                report.schema_errors.append(
                    f"Exercise {ex.id} ({ex.letter_kh}): multiple_choice requires exactly 1 correct option"
                )
            unit_letters = {u.letter_kh for u in by_unit[ex.unit_id]}
            for opt in ex.options:
                if opt.option_text_kh and opt.option_text_kh not in unit_letters:
                    report.schema_errors.append(
                        f"Exercise {ex.id}: distractor {opt.option_text_kh} outside unit category"
                    )

        if ex.exercise_type == "image_select":
            if len(ex.options) != 2:
                report.schema_errors.append(
                    f"Exercise {ex.id} ({ex.letter_kh}): image_select requires 2 options"
                )
            correct = [o for o in ex.options if o.is_correct]
            if len(correct) != 1:
                report.schema_errors.append(
                    f"Exercise {ex.id} ({ex.letter_kh}): image_select requires exactly 1 correct option"
                )
            kh_seen: set[str] = set()
            for opt in ex.options:
                if opt.option_text_kh in kh_seen:
                    report.schema_errors.append(
                        f"Exercise {ex.id} ({ex.letter_kh}): duplicate image_select option"
                    )
                kh_seen.add(opt.option_text_kh or "")
                letter_item = next((i for i in items if i.letter_kh == opt.option_text_kh), None)
                if letter_item and letter_item.unit_id != ex.unit_id:
                    report.schema_errors.append(
                        f"Exercise {ex.id}: image distractor outside unit category"
                    )

        if ex.exercise_type == "free_form":
            if not ex.correct_answer:
                report.schema_errors.append(
                    f"Exercise {ex.id} ({ex.letter_kh}): free_form missing correct_answer"
                )
            if ex.options:
                report.schema_errors.append(
                    f"Exercise {ex.id} ({ex.letter_kh}): free_form must not have options"
                )

        if not ex.question_en or not ex.question_kh:
            report.schema_errors.append(f"Exercise {ex.id}: missing bilingual question text")

        if ex.lesson_id <= 0 or ex.letter_id <= 0:
            report.schema_errors.append(f"Exercise {ex.id}: invalid foreign-key reference")

    report.missing_items = sorted(set(report.missing_items))
    report.duplicate_questions = sorted(set(report.duplicate_questions))
    report.schema_errors = sorted(set(report.schema_errors))

    report.coverage_status = (
        "PASS"
        if not report.missing_items and report.coverage_percent == 100.0
        else "FAIL"
    )
    report.validation_status = (
        "PASS"
        if not report.duplicate_questions and not report.schema_errors
        else "FAIL"
    )

    return report


def exercises_to_json(
    items: list[CurriculumItem],
    exercises: list[GeneratedExercise],
    options: list[GeneratedOption],
    report: ValidationReport,
) -> dict[str, Any]:
    return {
        "metadata": {
            "source": "seed_curriculum.py",
            "categories": EXPECTED_CATEGORIES,
            "exercise_types": list(EXERCISE_TYPES),
            "questions_per_letter": 3,
        },
        "validation": report.to_dict(),
        "curriculum_items": [
            {
                "letter_id": item.letter_id,
                "lesson_id": item.lesson_id,
                "chapter_id": item.chapter_id,
                "unit_id": item.unit_id,
                "unit_name_en": item.unit_name_en,
                "letter_kh": item.letter_kh,
                "letter_en": item.letter_en,
                "primary_media_id": item.primary_media_id,
                "image_ref": _image_ref(item.letter_id),
            }
            for item in items
        ],
        "finger_exercises": [
            {
                "id": ex.id,
                "lesson_id": ex.lesson_id,
                "question_en": ex.question_en,
                "question_kh": ex.question_kh,
                "exercise_type": ex.exercise_type,
                "media_id": ex.media_id,
                "correct_answer": ex.correct_answer,
                "explanation_en": None,
                "explanation_kh": None,
                "order_index": ex.order_index,
                "is_active": True,
                "letter_id": ex.letter_id,
                "letter_kh": ex.letter_kh,
                "letter_en": ex.letter_en,
                "unit_id": ex.unit_id,
                "image_ref": ex.image_ref,
            }
            for ex in exercises
        ],
        "finger_exercise_options": [
            {
                "id": opt.id,
                "exercise_id": opt.exercise_id,
                "option_text_en": opt.option_text_en,
                "option_text_kh": opt.option_text_kh,
                "media_id": opt.media_id,
                "is_correct": opt.is_correct,
                "points": 1,
                "order_index": opt.order_index,
                "image_ref": opt.image_ref,
            }
            for opt in options
        ],
    }


def generate_markdown(items: list[CurriculumItem], exercises: list[GeneratedExercise]) -> str:
    lines: list[str] = [
        "# Khmer Sign Language Quiz Questions",
        "",
        "## Validation Report",
        "",
        f"- Curriculum Items: {len(items)}",
        f"- Questions Generated: {len(exercises)}",
        f"- Expected Questions: {len(items)} × 3 = {len(items) * 3}",
        f"- Coverage: {100.0 if len(exercises) == len(items) * 3 else round(100 * len(exercises) / (len(items) * 3), 2)}%",
        "",
    ]

    ex_by_letter: dict[int, list[GeneratedExercise]] = {}
    for ex in exercises:
        ex_by_letter.setdefault(ex.letter_id, []).append(ex)
    for letter_exercises in ex_by_letter.values():
        letter_exercises.sort(key=lambda row: row.order_index)

    current_unit_id: int | None = None
    for item in items:
        if item.unit_id != current_unit_id:
            current_unit_id = item.unit_id
            lines.extend(["", f"## Unit {item.unit_id}: {item.unit_name_en}", ""])

        lines.append(f"### Letter: {item.letter_kh} ({item.letter_en})")
        lines.append("")

        letter_exercises = ex_by_letter[item.letter_id]

        mc = next(ex for ex in letter_exercises if ex.exercise_type == "multiple_choice")
        lines.append("1. Multiple Choice")
        lines.append("Question: What is the character for this sign?")
        lines.append("")
        for opt in sorted(mc.options, key=lambda row: row.order_index):
            mark = "x" if opt.is_correct else " "
            lines.append(f"- [{mark}] {opt.option_text_kh} ({opt.option_text_en})")
        lines.append("")

        img = next(ex for ex in letter_exercises if ex.exercise_type == "image_select")
        lines.append("2. Image Selection")
        lines.append("")
        lines.append(f'Question: Which sign represents "{item.letter_kh}"?')
        lines.append("")
        for opt in sorted(img.options, key=lambda row: row.order_index):
            mark = "x" if opt.is_correct else " "
            ref = opt.image_ref or _image_ref(item.letter_id)
            lines.append(f"- [{mark}] {ref}")
        lines.append("")

        ff = next(ex for ex in letter_exercises if ex.exercise_type == "free_form")
        lines.append("3. Freeform")
        lines.append("")
        lines.append(f'Question: Type the Khmer letter for "{item.letter_en}".')
        lines.append("")
        lines.append("Answer:")
        lines.append(ff.correct_answer or item.letter_kh)
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def print_summary(items: list[CurriculumItem], exercises: list[GeneratedExercise], report: ValidationReport) -> None:
    mc_count = sum(1 for ex in exercises if ex.exercise_type == "multiple_choice")
    img_count = sum(1 for ex in exercises if ex.exercise_type == "image_select")
    ff_count = sum(1 for ex in exercises if ex.exercise_type == "free_form")

    print("=" * 60)
    print("KHMER SIGN LANGUAGE QUIZ DATASET GENERATION")
    print("=" * 60)
    print()
    print("Curriculum source audit:")
    for name, letters in CATEGORY_LETTER_LISTS.items():
        print(f"  {name}: {len(letters)} items")
    print(f"  TOTAL: {sum(len(v) for v in CATEGORY_LETTER_LISTS.values())} items")
    print()

    if report.curriculum_warnings:
        print("Curriculum warnings:")
        for warning in report.curriculum_warnings:
            print(f"  - {warning}")
        print()

    print("Validation report:")
    print(f"  Curriculum Items: {report.curriculum_items}")
    print(f"  Questions Generated: {report.questions_generated}")
    print(f"  Expected Questions: {report.expected_questions}")
    print(f"  Coverage: {report.coverage_percent}%")
    print(f"  Missing Items: {report.missing_items or 'None'}")
    print(f"  Duplicate Questions: {report.duplicate_questions or 'None'}")
    print(f"  Schema Errors: {report.schema_errors or 'None'}")
    print()
    print(f"Total Curriculum Items: {len(items)}")
    print(f"Multiple Choice Questions: {mc_count}")
    print(f"Image Selection Questions: {img_count}")
    print(f"Freeform Questions: {ff_count}")
    print()
    print(f"Total Questions Generated: {len(items)} × 3 = {len(exercises)}")
    print()
    print(f"Coverage Status: {report.coverage_status}")
    print(f"Validation Status: {report.validation_status}")
    print("=" * 60)


def seed_database(
    exercises: list[GeneratedExercise],
    options: list[GeneratedOption],
    *,
    wipe: bool = False,
) -> None:
    from sqlalchemy import text
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    import src.models  # noqa: F401
    from src.db.session import Base, SessionLocal

    tables = Base.metadata.tables

    exercise_rows = [
        {
            "id": ex.id,
            "lesson_id": ex.lesson_id,
            "question_en": ex.question_en,
            "question_kh": ex.question_kh,
            "exercise_type": ex.exercise_type,
            "media_id": ex.media_id,
            "correct_answer": ex.correct_answer,
            "explanation_en": None,
            "explanation_kh": None,
            "order_index": ex.order_index,
            "is_active": True,
        }
        for ex in exercises
    ]

    option_rows = [
        {
            "id": opt.id,
            "exercise_id": opt.exercise_id,
            "option_text_en": opt.option_text_en,
            "option_text_kh": opt.option_text_kh,
            "media_id": opt.media_id,
            "is_correct": opt.is_correct,
            "points": 1,
            "order_index": opt.order_index,
        }
        for opt in options
    ]

    def _upsert(db, table, rows: list[dict]) -> None:
        if not rows:
            return
        stmt = pg_insert(table).values(rows)
        pk_cols = [col.name for col in table.primary_key.columns]
        update_cols = {
            col.name: getattr(stmt.excluded, col.name)
            for col in table.columns
            if col.name not in set(pk_cols)
        }
        stmt = stmt.on_conflict_do_update(index_elements=pk_cols, set_=update_cols)
        db.execute(stmt)

    with SessionLocal.begin() as db:
        if wipe:
            db.execute(
                text(
                    "TRUNCATE TABLE finger_exercise_options, finger_exercises "
                    "RESTART IDENTITY CASCADE"
                )
            )
            print("Wiped finger_exercises and finger_exercise_options.")

        _upsert(db, tables["finger_exercises"], exercise_rows)
        _upsert(db, tables["finger_exercise_options"], option_rows)

    print(
        f"Seeded {len(exercise_rows)} exercises and {len(option_rows)} options into the database."
    )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate complete finger-spelling quiz dataset from seed_curriculum.py"
    )
    parser.add_argument(
        "--json-out",
        default=str(Path(__file__).resolve().parent / "quiz_dataset.json"),
        help="Path for JSON export (default: seed_data/quiz_dataset.json)",
    )
    parser.add_argument(
        "--md-out",
        default=str(Path(__file__).resolve().parent / "quiz_questions.md"),
        help="Path for markdown preview (default: seed_data/quiz_questions.md)",
    )
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Upsert generated exercises into the database",
    )
    parser.add_argument(
        "--wipe",
        action="store_true",
        help="Truncate exercise tables before seeding (use with --seed)",
    )
    return parser


def main() -> int:
    _configure_stdio_utf8()
    args = _build_parser().parse_args()

    source_report = validate_curriculum_source()
    items = build_curriculum_items()
    exercises, options = generate_exercises(items)
    report = validate_dataset(items, exercises, source_report)

    payload = exercises_to_json(items, exercises, options, report)

    json_path = Path(args.json_out)
    md_path = Path(args.md_out)
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(generate_markdown(items, exercises), encoding="utf-8")

    print_summary(items, exercises, report)
    print()
    print(f"JSON export: {json_path}")
    print(f"Markdown preview: {md_path}")

    if args.seed:
        if report.coverage_status != "PASS" or report.validation_status != "PASS":
            print("\nRefusing to seed database: validation did not pass.")
            return 1
        seed_database(exercises, options, wipe=args.wipe)

    if report.coverage_status != "PASS" or report.validation_status != "PASS":
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
