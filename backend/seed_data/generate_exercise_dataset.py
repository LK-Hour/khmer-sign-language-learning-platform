#!/usr/bin/env python3
"""
Generate a complete finger-spelling exercise dataset from seed_curriculum.py.

Produces 4 question types per letter (where the unit is large enough):
  1. multiple_choice  – "What is the character for this sign?" (media prompt, 4 text options)
  2. true_false       – "This sign represents X." (media prompt, True/False)
  3. multiple_answer  – "Select all signs for …" (text prompt, 4 or 6 media options, 2+ correct)
  4. matching         – pairs of (text label ↔ sign media); always 4 or 6 pairs

Run from the backend directory:
    python seed_data/generate_exercise_dataset.py
    python seed_data/generate_exercise_dataset.py --seed          # insert into DB
    python seed_data/generate_exercise_dataset.py --wipe --seed   # replace exercises
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


SEED_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SEED_DIR))
import seed_fingert_spelling  # noqa: E402

DEPENDENT_VOWELS = seed_fingert_spelling.DEPENDENT_VOWELS
DIACRITICS = seed_fingert_spelling.DIACRITICS
INDEPENDENT_VOWELS = seed_fingert_spelling.INDEPENDENT_VOWELS
MAIN_CONSONANTS = seed_fingert_spelling.MAIN_CONSONANTS
NUMBERS = seed_fingert_spelling.NUMBERS
SUB_CONSONANTS = seed_fingert_spelling.SUB_CONSONANTS
UNITS_META = seed_fingert_spelling.UNITS_META
_build_curriculum = seed_fingert_spelling._build_curriculum

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


@dataclass
class GeneratedExercise:
    id: int
    lesson_id: int
    unit_id: int
    letter_id: int
    letter_kh: str
    letter_en: str
    unit_name_en: str
    exercise_type: str
    question_en: str
    question_kh: str
    media_id: int | None
    order_index: int
    options: list[GeneratedOption] = field(default_factory=list)


def _deterministic_shuffle(items: list[Any], seed_key: str) -> list[Any]:
    if len(items) <= 1:
        return list(items)
    digest = hashlib.md5(seed_key.encode("utf-8")).hexdigest()
    keyed = [
        (int(digest[(idx * 2) % len(digest) : (idx * 2) % len(digest) + 2], 16), idx, item)
        for idx, item in enumerate(items)
    ]
    keyed.sort()
    return [item for _, _, item in keyed]


def _pick_distractor_indices(unit_size: int, target_index: int, count: int, salt: int = 0) -> list[int]:
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


def _items_by_unit(items: list[CurriculumItem]) -> dict[int, list[CurriculumItem]]:
    grouped: dict[int, list[CurriculumItem]] = {}
    for item in items:
        grouped.setdefault(item.unit_id, []).append(item)
    return grouped


def _chapter_groups(items: list[CurriculumItem]) -> list[list[CurriculumItem]]:
    """Group items by chapter_id, preserving curriculum order."""
    groups: dict[int, list[CurriculumItem]] = {}
    for item in items:
        groups.setdefault(item.chapter_id, []).append(item)
    return list(groups.values())


def _matching_groups(items: list[CurriculumItem]) -> list[list[CurriculumItem]]:
    """Build matching sets with exactly 4 or 6 pairs (prefer 6 when possible)."""
    if not items:
        return []

    shuffled = _deterministic_shuffle(items, f"match-unit:{items[0].unit_id}")
    result: list[list[CurriculumItem]] = []
    i = 0
    n = len(shuffled)

    while i < n:
        remaining = n - i
        if remaining >= 6 and remaining != 7:
            # Prefer 6; skip the awkward remainder-1 case (7 → take 4 instead).
            result.append(shuffled[i : i + 6])
            i += 6
        elif remaining >= 4:
            result.append(shuffled[i : i + 4])
            i += 4
        else:
            break

    return result


def _multiple_answer_sets(
    items: list[CurriculumItem],
) -> list[tuple[list[CurriculumItem], list[CurriculumItem]]]:
    """Build multiple-answer sets: total options 4 or 6, with at least 2 correct."""
    if len(items) < 4:
        return []

    shuffled = _deterministic_shuffle(items, f"ma-unit:{items[0].unit_id}")
    result: list[tuple[list[CurriculumItem], list[CurriculumItem]]] = []
    i = 0
    n = len(shuffled)

    while i < n:
        remaining = n - i
        if remaining < 2:
            break

        # Prefer 6 options with 2–3 correct when the unit is large enough.
        if n >= 6 and remaining >= 2:
            correct_count = 3 if remaining >= 3 else 2
            total = 6
        else:
            correct_count = 2
            total = 4

        correct = shuffled[i : i + correct_count]
        i += correct_count

        others = [item for item in items if item not in correct]
        distractors_needed = total - len(correct)
        if len(others) < distractors_needed:
            # Fall back to 4 options if we cannot fill a 6-option set.
            total = 4
            distractors_needed = total - len(correct)
            if len(correct) < 2 or len(others) < distractors_needed:
                break
        distractors = _deterministic_shuffle(
            others, f"ma_d:{sum(c.letter_id for c in correct)}"
        )[:distractors_needed]
        if len(correct) + len(distractors) != total or len(correct) < 2:
            break
        result.append((correct, distractors))

    return result


def generate_exercises(items: list[CurriculumItem]) -> tuple[list[GeneratedExercise], list[GeneratedOption]]:
    by_unit = _items_by_unit(items)
    exercises: list[GeneratedExercise] = []
    all_options: list[GeneratedOption] = []

    exercise_id = 1
    option_id = 1

    for item in items:
        unit_items = by_unit[item.unit_id]
        unit_size = len(unit_items)

        # ── 1. MULTIPLE CHOICE ─────────────────────────────────────────────
        # Prompt: sign media; 4 text options (Khmer chars); exactly one correct
        if unit_size >= 5:
            distractor_indices = _pick_distractor_indices(unit_size, item.index_in_unit, 3, salt=item.letter_id)
            distractors = [unit_items[i] for i in distractor_indices]
            mc_choices = [
                (item.letter_kh, item.letter_en, True),
                *((d.letter_kh, d.letter_en, False) for d in distractors),
            ]
            mc_choices = _deterministic_shuffle(mc_choices, f"mc:{item.letter_id}:{item.lesson_id}")

            mc_ex = GeneratedExercise(
                id=exercise_id,
                lesson_id=item.lesson_id,
                unit_id=item.unit_id,
                letter_id=item.letter_id,
                letter_kh=item.letter_kh,
                letter_en=item.letter_en,
                unit_name_en=item.unit_name_en,
                exercise_type="multiple_choice",
                question_en="What is the character for this sign?",
                question_kh="តើអក្សរណាដែលគូទៅនឹងសញ្ញានេះ?",
                media_id=item.primary_media_id,
                order_index=1,
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
                mc_ex.options.append(opt)
                all_options.append(opt)
                option_id += 1
            exercises.append(mc_ex)
            exercise_id += 1

        # ── 2. TRUE / FALSE ────────────────────────────────────────────────
        # Prompt: sign media + "This sign represents [letter]"; True/False
        # Randomise whether the statement is true or false.
        import hashlib as _hlib
        tf_seed = int(_hlib.md5(f"tf:{item.letter_id}".encode()).hexdigest(), 16)
        is_true_statement = (tf_seed % 2) == 0

        if is_true_statement:
            display_kh = item.letter_kh
            display_en = item.letter_en
        else:
            # Pick a different letter as the false label
            fake_idx = (item.index_in_unit + 1 + (tf_seed % 3)) % unit_size
            fake = unit_items[fake_idx]
            display_kh = fake.letter_kh
            display_en = fake.letter_en

        tf_ex = GeneratedExercise(
            id=exercise_id,
            lesson_id=item.lesson_id,
            unit_id=item.unit_id,
            letter_id=item.letter_id,
            letter_kh=item.letter_kh,
            letter_en=item.letter_en,
            unit_name_en=item.unit_name_en,
            exercise_type="true_false",
            question_en=f'This sign represents the character "{display_kh}" ({display_en}).',
            question_kh=f'សញ្ញានេះតំណាងអក្សរ "{display_kh}" ({display_en})។',
            media_id=item.primary_media_id,
            order_index=2,
        )
        for order_idx, (label_en, label_kh, is_correct) in enumerate(
            [("True", "ត្រូវ", is_true_statement), ("False", "មិនត្រូវ", not is_true_statement)],
            start=1,
        ):
            opt = GeneratedOption(
                id=option_id,
                exercise_id=exercise_id,
                option_text_en=label_en,
                option_text_kh=label_kh,
                media_id=None,
                is_correct=is_correct,
                order_index=order_idx,
            )
            tf_ex.options.append(opt)
            all_options.append(opt)
            option_id += 1
        exercises.append(tf_ex)
        exercise_id += 1

    # ── 3. MULTIPLE ANSWER ─────────────────────────────────────────────────
    # Text exercise has exactly 4 or 6 media options, with at least 2 correct.
    for unit_items in by_unit.values():
        for correct_group, distractors in _multiple_answer_sets(unit_items):
            options_pool = _deterministic_shuffle(
                list(correct_group) + distractors,
                f"ma:{sum(g.letter_id for g in correct_group)}",
            )
            anchor = correct_group[0]
            letter_labels = "、".join(g.letter_kh for g in correct_group)
            correct_ids = {g.letter_id for g in correct_group}

            ma_ex = GeneratedExercise(
                id=exercise_id,
                lesson_id=anchor.lesson_id,
                unit_id=anchor.unit_id,
                letter_id=anchor.letter_id,
                letter_kh=anchor.letter_kh,
                letter_en=anchor.letter_en,
                unit_name_en=anchor.unit_name_en,
                exercise_type="multiple_answer",
                question_en=f"Select ALL sign images that belong to this group ({letter_labels}).",
                question_kh=f"ជ្រើសរើសសញ្ញាទាំងអស់ដែលជាអក្សរក្នុងក្រុមនេះ ({letter_labels})។",
                media_id=None,
                order_index=3,
            )
            for order_idx, pool_item in enumerate(options_pool, start=1):
                opt = GeneratedOption(
                    id=option_id,
                    exercise_id=exercise_id,
                    option_text_en=pool_item.letter_en,
                    option_text_kh=pool_item.letter_kh,
                    media_id=pool_item.primary_media_id,
                    is_correct=pool_item.letter_id in correct_ids,
                    order_index=order_idx,
                )
                ma_ex.options.append(opt)
                all_options.append(opt)
                option_id += 1
            exercises.append(ma_ex)
            exercise_id += 1

    # ── 4. MATCHING (per chapter group) ───────────────────────────────────
    # One exercise per chapter group: drag text labels onto sign media.
    # Each option row = one pair: option_text = Khmer char, media_id = sign image.
    # Always 4 or 6 pairs (prefer 6 when the chapter is large enough).
    for unit_items in by_unit.values():
        for group in _matching_groups(unit_items):
            anchor = group[0]
            letter_labels = "、".join(g.letter_kh for g in group)
            shuffled = _deterministic_shuffle(group, f"match:{sum(g.letter_id for g in group)}")

            match_ex = GeneratedExercise(
                id=exercise_id,
                lesson_id=anchor.lesson_id,
                unit_id=anchor.unit_id,
                letter_id=anchor.letter_id,
                letter_kh=anchor.letter_kh,
                letter_en=anchor.letter_en,
                unit_name_en=anchor.unit_name_en,
                exercise_type="matching",
                question_en=f"Match each character to its sign ({letter_labels}).",
                question_kh=f"ផ្គូផ្គងអក្សរម្នាក់ៗទៅនឹងសញ្ញារបស់វា ({letter_labels})។",
                media_id=None,
                order_index=4,
            )
            for order_idx, g in enumerate(shuffled, start=1):
                opt = GeneratedOption(
                    id=option_id,
                    exercise_id=exercise_id,
                    option_text_en=g.letter_en,
                    option_text_kh=g.letter_kh,
                    media_id=g.primary_media_id,
                    is_correct=True,  # every pair is part of the answer key
                    order_index=order_idx,
                )
                match_ex.options.append(opt)
                all_options.append(opt)
                option_id += 1
            exercises.append(match_ex)
            exercise_id += 1

    return exercises, all_options


def exercises_to_json(
    items: list[CurriculumItem],
    exercises: list[GeneratedExercise],
    options: list[GeneratedOption],
) -> dict[str, Any]:
    type_counts = {}
    for ex in exercises:
        type_counts[ex.exercise_type] = type_counts.get(ex.exercise_type, 0) + 1
    return {
        "metadata": {
            "source": "seed_curriculum.py",
            "exercise_types": ["multiple_choice", "true_false", "multiple_answer", "matching"],
            "type_counts": type_counts,
            "total_exercises": len(exercises),
        },
        "finger_exercises": [
            {
                "id": ex.id,
                "lesson_id": ex.lesson_id,
                "unit_id": ex.unit_id,
                "question_en": ex.question_en,
                "question_kh": ex.question_kh,
                "exercise_type": ex.exercise_type,
                "media_id": ex.media_id,
                "order_index": ex.order_index,
                "is_active": True,
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
            }
            for opt in options
        ],
    }


def print_summary(items: list[CurriculumItem], exercises: list[GeneratedExercise]) -> None:
    from collections import Counter
    by_unit: dict[int, dict[str, int]] = {}
    for ex in exercises:
        by_unit.setdefault(ex.unit_id, Counter())[ex.exercise_type] += 1  # type: ignore[arg-type]

    print("=" * 60)
    print("KHMER SIGN LANGUAGE EXERCISE DATASET GENERATION")
    print("=" * 60)
    print()
    type_counts = Counter(ex.exercise_type for ex in exercises)
    for t, c in type_counts.items():
        print(f"  {t}: {c}")
    print(f"  TOTAL: {len(exercises)}")
    print()
    print("Per-unit counts (need ≥15 for a full exercise):")
    unit_name: dict[int, str] = {item.unit_id: item.unit_name_en for item in items}
    for uid, counts in sorted(by_unit.items()):
        total = sum(counts.values())
        name = unit_name.get(uid, str(uid))
        types_present = ", ".join(sorted(counts.keys()))
        status = "OK" if total >= 15 else f"WARN (only {total})"
        print(f"  Unit {uid} ({name}): {total} exercises [{types_present}] → {status}")
    print("=" * 60)


def seed_database(exercises: list[GeneratedExercise], options: list[GeneratedOption], *, wipe: bool = False) -> None:
    from sqlalchemy import text
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    import src.models  # noqa: F401
    from src.db.session import Base, SessionLocal

    tables = Base.metadata.tables

    exercise_rows = [
        {
            "id": ex.id,
            "lesson_id": ex.lesson_id,
            "unit_id": ex.unit_id,
            "question_en": ex.question_en,
            "question_kh": ex.question_kh,
            "exercise_type": ex.exercise_type,
            "media_id": ex.media_id,
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

    print(f"Seeded {len(exercise_rows)} exercises and {len(option_rows)} options.")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate finger-spelling exercise dataset (4 types)"
    )
    parser.add_argument("--json-out", default=str(SEED_DIR / "exercise_dataset.json"))
    parser.add_argument("--seed", action="store_true")
    parser.add_argument("--wipe", action="store_true")
    return parser


def main() -> int:
    _configure_stdio_utf8()
    args = _build_parser().parse_args()

    items = build_curriculum_items()
    exercises, options = generate_exercises(items)

    payload = exercises_to_json(items, exercises, options)
    Path(args.json_out).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    print_summary(items, exercises)
    print(f"\nJSON export: {args.json_out}")

    if args.seed:
        seed_database(exercises, options, wipe=args.wipe)

    return 0


if __name__ == "__main__":
    sys.exit(main())
