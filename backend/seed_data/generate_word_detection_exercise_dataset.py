#!/usr/bin/env python3
"""
Generate a complete word-detection exercise dataset from the already-seeded
word_detection curriculum (run seed_word_detection.py first).

Mirrors generate_exercise_dataset.py's approach (deterministic hash-seeded
shuffling, no true randomness) but adapted to word_detection's schema:
  - exercise_type enum is multiple_choice / free_form / image_select / matching
    (no true_false / multiple_answer like finger spelling has).
  - free_form is skipped: word_detection_exercise_service.py grades it against
    exercise.correct_answer / reads exercise.explanation_en/kh, but those columns
    don't exist on word_detection_exercises (only description_en/kh) — selecting
    a free_form exercise today would raise AttributeError. Until that schema/
    service mismatch is fixed, this generator produces none.
  - multiple_answer has no equivalent type in the enum, so it's skipped too.

Produces, per word (lesson):
  1. multiple_choice - video prompt, "What word does this sign represent?", 4 text
     options (1 correct + 3 distractors).
  2. image_select    - text prompt naming the word, 2 video options (1 correct +
     1 distractor) — the closest analogue to finger spelling's true_false slot.

Produces, per unit (grouped, same pattern as finger spelling's matching):
  3. matching        - 4 or 6 (word text <-> sign video) pairs.

Distractors are pooled from the ENTIRE word list, not scoped to the word's own
unit/chapter — several units (Vehicles: 2 words, Sports: 2 words, Pronouns and
Nouns: 4 words) are too small to supply in-unit distractors.

Curriculum + primary media are read live from the database (not re-derived from
the dataset directory) so exercise media_ids can't drift out of sync the way
finger spelling's did when its dataset folder was renamed.

Run from the backend directory:
    python seed_data/generate_word_detection_exercise_dataset.py
    python seed_data/generate_word_detection_exercise_dataset.py --seed          # insert into DB
    python seed_data/generate_word_detection_exercise_dataset.py --wipe --seed   # replace exercises
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

DISTRACTOR_OFFSETS = (1, 2, 3, 5, 7, 11, 13, 17)


@dataclass(frozen=True)
class WordItem:
    word_id: int
    lesson_id: int
    chapter_id: int
    unit_id: int
    unit_name_en: str
    unit_name_kh: str
    word_kh: str
    word_en: str
    global_index: int
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


def _pick_distractor_indices(total: int, target_index: int, count: int, salt: int = 0) -> list[int]:
    if total <= count + 1:
        raise ValueError(f"Pool has {total} items; need at least {count + 2} for distractors")
    chosen: list[int] = []
    used = {target_index}
    offset_i = salt
    while len(chosen) < count:
        step = DISTRACTOR_OFFSETS[offset_i % len(DISTRACTOR_OFFSETS)]
        candidate = (target_index + step + offset_i) % total
        offset_i += 1
        if candidate in used:
            continue
        used.add(candidate)
        chosen.append(candidate)
    return chosen


def build_word_items() -> list[WordItem]:
    """Read curriculum + primary media live from the DB — the source of truth."""
    from sqlalchemy import text

    from src.db.session import SessionLocal

    with SessionLocal() as db:
        rows = db.execute(
            text(
                """
                SELECT w.id AS word_id, l.id AS lesson_id, c.id AS chapter_id,
                       c.unit_id, u.name_en, u.name_kh, w.word_kh, w.word_en
                FROM word_detection_words w
                JOIN word_detection_lesson_words lw ON lw.word_id = w.id
                JOIN word_detection_lessons l ON l.id = lw.lesson_id
                JOIN word_detection_chapters c ON c.id = l.chapter_id
                JOIN word_detection_units u ON u.id = c.unit_id
                ORDER BY l.id
                """
            )
        ).fetchall()

        media_rows = db.execute(
            text("SELECT word_id, media_id FROM word_detection_word_medias ORDER BY id")
        ).fetchall()

    primary_media: dict[int, int] = {}
    for word_id, media_id in media_rows:
        primary_media.setdefault(int(word_id), int(media_id))

    items: list[WordItem] = []
    for idx, row in enumerate(rows):
        items.append(
            WordItem(
                word_id=int(row.word_id),
                lesson_id=int(row.lesson_id),
                chapter_id=int(row.chapter_id),
                unit_id=int(row.unit_id),
                unit_name_en=row.name_en,
                unit_name_kh=row.name_kh,
                word_kh=row.word_kh,
                word_en=row.word_en or "",
                global_index=idx,
                primary_media_id=primary_media.get(int(row.word_id)),
            )
        )
    return items


def _items_by_unit(items: list[WordItem]) -> dict[int, list[WordItem]]:
    grouped: dict[int, list[WordItem]] = {}
    for item in items:
        grouped.setdefault(item.unit_id, []).append(item)
    return grouped


def _matching_groups(items: list[WordItem]) -> list[list[WordItem]]:
    """Build matching sets with exactly 4 or 6 pairs (prefer 6 when possible)."""
    if not items:
        return []

    shuffled = _deterministic_shuffle(items, f"match-unit:{items[0].unit_id}")
    result: list[list[WordItem]] = []
    i = 0
    n = len(shuffled)

    while i < n:
        remaining = n - i
        if remaining >= 6 and remaining != 7:
            result.append(shuffled[i : i + 6])
            i += 6
        elif remaining >= 4:
            result.append(shuffled[i : i + 4])
            i += 4
        else:
            break

    return result


def generate_exercises(items: list[WordItem]) -> tuple[list[GeneratedExercise], list[GeneratedOption]]:
    by_unit = _items_by_unit(items)
    total = len(items)
    exercises: list[GeneratedExercise] = []
    all_options: list[GeneratedOption] = []

    exercise_id = 1
    option_id = 1

    for item in items:
        # ── 1. MULTIPLE CHOICE ─────────────────────────────────────────────
        # Prompt: sign video; 4 text options (Khmer words); exactly one correct.
        # Distractors pooled from the entire word list (several units are too
        # small to supply 3 in-unit distractors).
        distractor_indices = _pick_distractor_indices(total, item.global_index, 3, salt=item.word_id)
        distractors = [items[i] for i in distractor_indices]
        mc_choices = [
            (item.word_kh, item.word_en, True),
            *((d.word_kh, d.word_en, False) for d in distractors),
        ]
        mc_choices = _deterministic_shuffle(mc_choices, f"mc:{item.word_id}:{item.lesson_id}")

        mc_ex = GeneratedExercise(
            id=exercise_id,
            lesson_id=item.lesson_id,
            unit_id=item.unit_id,
            exercise_type="multiple_choice",
            question_en="What word does this sign represent?",
            question_kh="តើសញ្ញានេះមានន័យថាអ្វី?",
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

        # ── 2. IMAGE SELECT ────────────────────────────────────────────────
        # Prompt: text naming the word; 2 video options, exactly one correct.
        fake_index = _pick_distractor_indices(total, item.global_index, 1, salt=item.word_id + 1)[0]
        fake = items[fake_index]
        is_choices = _deterministic_shuffle(
            [(item.primary_media_id, True), (fake.primary_media_id, False)],
            f"is:{item.word_id}:{item.lesson_id}",
        )

        is_ex = GeneratedExercise(
            id=exercise_id,
            lesson_id=item.lesson_id,
            unit_id=item.unit_id,
            exercise_type="image_select",
            question_en=f'Which video shows the sign for "{item.word_kh}" ({item.word_en})?',
            question_kh=f'តើវីដេអូមួយណាបង្ហាញសញ្ញាសម្រាប់ពាក្យ "{item.word_kh}"?',
            media_id=None,
            order_index=2,
        )
        for order_idx, (media_id, is_correct) in enumerate(is_choices, start=1):
            opt = GeneratedOption(
                id=option_id,
                exercise_id=exercise_id,
                option_text_en=None,
                option_text_kh=None,
                media_id=media_id,
                is_correct=is_correct,
                order_index=order_idx,
            )
            is_ex.options.append(opt)
            all_options.append(opt)
            option_id += 1
        exercises.append(is_ex)
        exercise_id += 1

    # ── 3. MATCHING (per unit group) ───────────────────────────────────────
    # One exercise per unit-sized group: drag word labels onto sign videos.
    # Always 4 or 6 pairs (prefer 6). Units with <4 words get none, same as
    # finger spelling's rule.
    for unit_items in by_unit.values():
        for group in _matching_groups(unit_items):
            anchor = group[0]
            word_labels = "、".join(g.word_kh for g in group)
            shuffled = _deterministic_shuffle(group, f"match:{sum(g.word_id for g in group)}")

            match_ex = GeneratedExercise(
                id=exercise_id,
                lesson_id=anchor.lesson_id,
                unit_id=anchor.unit_id,
                exercise_type="matching",
                question_en=f"Match each word to its sign ({word_labels}).",
                question_kh=f"ផ្គូផ្គងពាក្យម្នាក់ៗទៅនឹងសញ្ញារបស់វា ({word_labels})។",
                media_id=None,
                order_index=3,
            )
            for order_idx, g in enumerate(shuffled, start=1):
                opt = GeneratedOption(
                    id=option_id,
                    exercise_id=exercise_id,
                    option_text_en=g.word_en,
                    option_text_kh=g.word_kh,
                    media_id=g.primary_media_id,
                    is_correct=True,
                    order_index=order_idx,
                )
                match_ex.options.append(opt)
                all_options.append(opt)
                option_id += 1
            exercises.append(match_ex)
            exercise_id += 1

    return exercises, all_options


def exercises_to_json(
    items: list[WordItem],
    exercises: list[GeneratedExercise],
    options: list[GeneratedOption],
) -> dict[str, Any]:
    type_counts: dict[str, int] = {}
    for ex in exercises:
        type_counts[ex.exercise_type] = type_counts.get(ex.exercise_type, 0) + 1
    return {
        "metadata": {
            "source": "generate_word_detection_exercise_dataset.py",
            "exercise_types": ["multiple_choice", "image_select", "matching"],
            "type_counts": type_counts,
            "total_exercises": len(exercises),
        },
        "word_detection_exercises": [
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
        "word_detection_exercise_options": [
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


def print_summary(items: list[WordItem], exercises: list[GeneratedExercise]) -> None:
    from collections import Counter

    by_unit: dict[int, Counter] = {}
    for ex in exercises:
        by_unit.setdefault(ex.unit_id, Counter())[ex.exercise_type] += 1

    print("=" * 60)
    print("KHMER SIGN LANGUAGE WORD DETECTION EXERCISE DATASET GENERATION")
    print("=" * 60)
    print()
    type_counts = Counter(ex.exercise_type for ex in exercises)
    for t, c in type_counts.items():
        print(f"  {t}: {c}")
    print(f"  TOTAL: {len(exercises)}")
    print()
    print("Per-unit counts:")
    unit_name: dict[int, str] = {item.unit_id: item.unit_name_en for item in items}
    for uid, counts in sorted(by_unit.items()):
        total = sum(counts.values())
        name = unit_name.get(uid, str(uid))
        types_present = ", ".join(sorted(counts.keys()))
        print(f"  Unit {uid} ({name}): {total} exercises [{types_present}]")
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
                    "TRUNCATE TABLE word_detection_exercise_options, word_detection_exercises "
                    "RESTART IDENTITY CASCADE"
                )
            )
            print("Wiped word_detection_exercises and word_detection_exercise_options.")

        _upsert(db, tables["word_detection_exercises"], exercise_rows)
        _upsert(db, tables["word_detection_exercise_options"], option_rows)

    print(f"Seeded {len(exercise_rows)} exercises and {len(option_rows)} options.")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate word-detection exercise dataset (3 types)"
    )
    parser.add_argument("--json-out", default=str(SEED_DIR / "word_detection_exercise_dataset.json"))
    parser.add_argument("--seed", action="store_true")
    parser.add_argument("--wipe", action="store_true")
    return parser


def main() -> int:
    _configure_stdio_utf8()
    args = _build_parser().parse_args()

    items = build_word_items()
    if not items:
        print("❌ No word_detection curriculum found. Run seed_word_detection.py first.")
        return 1

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
