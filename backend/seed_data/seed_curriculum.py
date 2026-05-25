#!/usr/bin/env python3
"""
Seed the Khmer Sign Language finger spelling curriculum.

Run from the backend directory:
    python seed_data/seed_curriculum.py
    python seed_data/seed_curriculum.py --wipe   # clear curriculum tables first

Structure rules (1 lesson = 1 letter, 5 lessons per chapter):
  - Remainder <  4  → merge into last chapter
  - Remainder >= 4  → create a new smaller chapter
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def _configure_stdio_utf8() -> None:
    """Avoid UnicodeEncodeError when printing Khmer on Windows consoles."""
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except (OSError, ValueError, AttributeError):
                pass


BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from dotenv import load_dotenv

load_dotenv(BASE_DIR / ".env")

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert

from src.db.session import Base, SessionLocal  # noqa: E402

# Import models so metadata is populated
import src.models  # noqa: F401, E402
import importlib, pkgutil

for _mod in pkgutil.iter_modules(src.models.__path__, src.models.__name__ + "."):
    importlib.import_module(_mod.name)

# ── Letter lists ─────────────────────────────────────────────────────────────
# Each entry: (letter_kh, letter_en)

NUMBERS = [
    ("០", "0"),
    ("១", "1"),
    ("២", "2"),
    ("៣", "3"),
    ("៤", "4"),
    ("៥", "5"),
    ("៦", "6"),
    ("៧", "7"),
    ("៨", "8"),
    ("៩", "9"),
]

# 24 dependent vowels in standard Khmer teaching order:
#   18 base vowels first, then 6 compound forms at the end.
#   (ឹ and ៈ are curriculum-defined; hand-sign images not yet collected.)
DEPENDENT_VOWELS = [
    # ── 18 base vowels ───────────────────────────────────────────
    ("ា",  "aa"),
    ("ិ",  "ik"),
    ("ី",  "ei"),
    ("ឹ",  "euk"),    # not yet in dataset
    ("ឺ",  "ee"),
    ("ុ",  "ouk (short)"),
    ("ូ",  "oo"),
    ("ួ",  "ua"),
    ("ើ",  "er"),
    ("ឿ",  "eur"),
    ("ៀ",  "ear"),
    ("េ",  "ay"),
    ("ែ",  "ae"),
    ("ៃ",  "ai"),
    ("ោ",  "ao"),
    ("ៅ",  "au"),
    ("ំ",  "um"),
    ("ះ",  "h (final)"),
    # ── 6 compound vowels ────────────────────────────────────────
    ("ាំ", "am"),
    ("ុំ", "om"),
    ("ិះ",  "e (final)"),
    ("ុះ", "oh"),
    ("េះ", "eh"),
    ("ោះ", "aoh"),
]

# 33 main consonants in traditional Khmer alphabet order
MAIN_CONSONANTS = [
    ("ក", "Ka"),
    ("ខ", "Kha"),
    ("គ", "Ko"),
    ("ឃ", "Kho"),
    ("ង", "Ngo"),
    ("ច", "Cha"),
    ("ឆ", "Chha"),
    ("ជ", "Cho"),
    ("ឈ", "Chho"),
    ("ញ", "Nho"),
    ("ដ", "Da"),
    ("ឋ", "Tha"),
    ("ឌ", "Do"),
    ("ឍ", "Tho"),
    ("ណ", "Na"),
    ("ត", "Ta"),
    ("ថ", "Tha"),
    ("ទ", "To"),
    ("ធ", "Tho"),
    ("ន", "No"),
    ("ប", "Ba"),
    ("ផ", "Pha"),
    ("ព", "Po"),
    ("ភ", "Pho"),
    ("ម", "Mo"),
    ("យ", "Yo"),
    ("រ", "Ro"),
    ("ល", "Lo"),
    ("វ", "Vo"),
    ("ស", "So"),
    ("ហ", "Ho"),
    ("ឡ", "Lo (L)"),
    ("អ", "Ah"),
]

# 32 sub-consonants (coeng forms) — ឡ has no subscript form
SUB_CONSONANTS = [
    ("្ក", "Sub Ka"),
    ("្ខ", "Sub Kha"),
    ("្គ", "Sub Ko"),
    ("្ឃ", "Sub Kho"),
    ("្ង", "Sub Ngo"),
    ("្ច", "Sub Cha"),
    ("្ឆ", "Sub Chha"),
    ("្ជ", "Sub Cho"),
    ("្ឈ", "Sub Chho"),
    ("្ញ", "Sub Nho"),
    ("្ដ", "Sub Da"),
    ("្ឋ", "Sub Tha"),
    ("្ឌ", "Sub Do"),
    ("្ឍ", "Sub Tho"),
    ("្ណ", "Sub Na"),
    ("្ត", "Sub Ta"),
    ("្ថ", "Sub Tha"),
    ("្ទ", "Sub To"),
    ("្ធ", "Sub Tho"),
    ("្ន", "Sub No"),
    ("្ប", "Sub Ba"),
    ("្ផ", "Sub Pha"),
    ("្ព", "Sub Po"),
    ("្ភ", "Sub Pho"),
    ("្ម", "Sub Mo"),
    ("្យ", "Sub Yo"),
    ("្រ", "Sub Ro"),
    ("្ល", "Sub Lo"),
    ("្វ", "Sub Vo"),
    ("្ស", "Sub So"),
    ("្ហ", "Sub Ho"),
    ("្អ", "Sub Ah"),
]

# 14 diacritics, punctuation, and special signs (វណ្ណយុត្តិ)
DIACRITICS = [
    ("៉", "Musekatos"),
    ("៊", "Treisap"),
    ("៌", "Kakabat"),
    ("៍", "Toandakhiat"),
    ("៎", "Ahsda"),
    ("៏", "Samyok Sannya"),
    ("័", "Viriam"),
    ("។", "Khan (Period)"),
    ("។ល។", "Ellipsis (Etc.)"),
    ("៖", "Camnuc Pii Kuuh (Colon)"),
    ("ៗ", "Lek Attanak"),
    ("៚", "Koomuut"),
    ("!", "Exclamation Mark"),
    ("?", "Question Mark"),
]

# 14 independent vowels (ស្រៈឯករ)
# U+17A3 ឣ and U+17A4 ឤ are the proper independent-vowel code points
# (the dataset uses folder names "អ" and "អា" but those clash with the consonant)
INDEPENDENT_VOWELS = [
    ("ឣ", "a (short)"),    # dataset folder: "អ"
    ("ឤ", "aa (long)"),    # dataset folder: "អា"
    ("ឥ", "i (short)"),
    ("ឦ", "ii (long)"),
    ("ឧ", "u (short)"),
    ("ឩ", "uu (long)"),
    ("ឫ", "ry"),
    ("ឬ", "ryy"),
    ("ឭ", "ly"),
    ("ឮ", "lyy"),
    ("ឯ", "e"),
    ("ឰ", "ai"),
    ("ឱ", "o"),
    ("ឳ", "au"),
]

# ── Unit definitions ──────────────────────────────────────────────────────────

UNITS_META = [
    {
        "id": 1,
        "name_en": "Numbers",
        "name_kh": "លេខ",
        "description_en": "Learn Khmer sign language for numbers 0–9",
        "description_kh": "រៀនភាសាសញ្ញាខ្មែរសម្រាប់លេខ ០–៩",
        "order_index": 1,
        "letters": NUMBERS,
        "chapter_name_en": "Numbers",
        "chapter_name_kh": "លេខ",
    },
    {
        "id": 2,
        "name_en": "Dependent Vowels",
        "name_kh": "ស្រៈ",
        "description_en": "Learn the 24 Khmer dependent vowel signs",
        "description_kh": "រៀនស្រៈខ្មែរ ២៤",
        "order_index": 2,
        "letters": DEPENDENT_VOWELS,
        "chapter_name_en": "Dependent Vowels",
        "chapter_name_kh": "ស្រៈ",
    },
    {
        "id": 3,
        "name_en": "Main Consonants",
        "name_kh": "ព្យញ្ជនៈ",
        "description_en": "Learn the 33 main Khmer consonants",
        "description_kh": "រៀនព្យញ្ជនៈខ្មែរ ៣៣",
        "order_index": 3,
        "letters": MAIN_CONSONANTS,
        "chapter_name_en": "Main Consonants",
        "chapter_name_kh": "ព្យញ្ជនៈ",
    },
    {
        "id": 4,
        "name_en": "Sub Consonants",
        "name_kh": "ជើង",
        "description_en": "Learn the 32 Khmer sub-consonant​forms",
        "description_kh": "រៀនព្យញ្ជនៈខ្មែរជើង ៣២",
        "order_index": 4,
        "letters": SUB_CONSONANTS,
        "chapter_name_en": "Sub Consonants",
        "chapter_name_kh": "ជើង",
    },
    {
        "id": 5,
        "name_en": "Diacritics",
        "name_kh": "វណ្ណយុត្តិ",
        "description_en": "Learn Khmer diacritics, punctuation, and special signs",
        "description_kh": "រៀនវណ្ណយុត្តិ និងសញ្ញាពិសេស",
        "order_index": 5,
        "letters": DIACRITICS,
        "chapter_name_en": "Diacritics",
        "chapter_name_kh": "វណ្ណយុត្តិ",
    },
    {
        "id": 6,
        "name_en": "Independent Vowels",
        "name_kh": "ស្រៈពេញតួ",
        "description_en": "Learn the 14 Khmer independent vowels",
        "description_kh": "រៀនស្រៈពេញតួខ្មែរ ១៤",
        "order_index": 6,
        "letters": INDEPENDENT_VOWELS,
        "chapter_name_en": "Independent Vowels",
        "chapter_name_kh": "ស្រៈពេញតួ",
    },
]

# ── Khmer numerals for chapter numbering ──────────────────────────────────────

_KH_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"]


def _to_khmer_numeral(n: int) -> str:
    return "".join(_KH_DIGITS[int(d)] for d in str(n))


# ── Chapter grouping ──────────────────────────────────────────────────────────

CHAPTER_SIZE = 5


def group_into_chapters(letters: list, size: int = CHAPTER_SIZE) -> list[list]:
    """
    Split a letter list into chapters using the curriculum rule:
      remainder < 4  → merge into the last chapter
      remainder >= 4 → start a new chapter
    """
    total = len(letters)
    remainder = total % size
    full_chapters = total // size

    if remainder == 0:
        return [letters[i * size : (i + 1) * size] for i in range(full_chapters)]
    elif remainder < 4:
        # Merge remainder into the last full chapter
        groups = [letters[i * size : (i + 1) * size] for i in range(full_chapters - 1)]
        groups.append(letters[(full_chapters - 1) * size :])
        return groups
    else:
        # New (smaller) chapter for the remainder
        groups = [letters[i * size : (i + 1) * size] for i in range(full_chapters)]
        groups.append(letters[full_chapters * size :])
        return groups


# ── Database helpers ──────────────────────────────────────────────────────────

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


def _wipe_curriculum(db) -> None:
    """Truncate all curriculum tables (preserves user accounts and progress)."""
    db.execute(
        text(
            "TRUNCATE TABLE "
            "finger_lesson_letters, finger_lessons, finger_chapters, "
            "finger_units, finger_letters "
            "RESTART IDENTITY CASCADE"
        )
    )
    print("Wiped curriculum tables.")


# ── Seed builder ──────────────────────────────────────────────────────────────

def _build_curriculum() -> dict[str, list[dict]]:
    """
    Walk UNITS_META and produce flat row lists for every curriculum table.
    Returns a dict keyed by table name.
    """
    tables_meta = Base.metadata.tables

    all_letters: list[dict] = []
    all_units: list[dict] = []
    all_chapters: list[dict] = []
    all_lessons: list[dict] = []
    all_lesson_letters: list[dict] = []

    letter_id = 1
    chapter_id = 1
    lesson_id = 1
    lesson_letter_id = 1

    for unit_meta in UNITS_META:
        all_units.append(
            {
                "id": unit_meta["id"],
                "name_en": unit_meta["name_en"],
                "name_kh": unit_meta["name_kh"],
                "description_en": unit_meta["description_en"],
                "description_kh": unit_meta["description_kh"],
                "order_index": unit_meta["order_index"],
                "is_active": True,
            }
        )

        letter_tuples = unit_meta["letters"]
        chapter_groups = group_into_chapters(letter_tuples)

        for ch_idx, group in enumerate(chapter_groups):
            ch_num = ch_idx + 1
            ch_num_kh = _to_khmer_numeral(ch_num)
            first_kh = group[0][0]
            last_kh = group[-1][0]

            all_chapters.append(
                {
                    "id": chapter_id,
                    "unit_id": unit_meta["id"],
                    "name_en": f"{unit_meta['chapter_name_en']} {ch_num}",
                    "name_kh": f"{unit_meta['chapter_name_kh']} ទី {ch_num_kh}",
                    "description_en": f"{first_kh} – {last_kh}",
                    "description_kh": f"{first_kh} – {last_kh}",
                    "order_index": ch_num,
                    "is_active": True,
                }
            )

            for ltr_idx, (letter_kh, letter_en) in enumerate(group):
                all_letters.append(
                    {
                        "id": letter_id,
                        "letter_kh": letter_kh,
                        "letter_en": letter_en,
                        "description_en": None,
                        "description_kh": None,
                        "is_active": True,
                    }
                )

                all_lessons.append(
                    {
                        "id": lesson_id,
                        "chapter_id": chapter_id,
                        "name_en": letter_en,
                        "name_kh": letter_kh,
                        "description_en": None,
                        "description_kh": None,
                        "order_index": ltr_idx + 1,
                        "is_active": True,
                    }
                )

                all_lesson_letters.append(
                    {
                        "id": lesson_letter_id,
                        "lesson_id": lesson_id,
                        "letter_id": letter_id,
                        "order_index": 1,
                    }
                )

                letter_id += 1
                lesson_id += 1
                lesson_letter_id += 1

            chapter_id += 1

    return {
        "finger_letters": all_letters,
        "finger_units": all_units,
        "finger_chapters": all_chapters,
        "finger_lessons": all_lessons,
        "finger_lesson_letters": all_lesson_letters,
    }


def _print_summary(data: dict[str, list[dict]]) -> None:
    print("\nCurriculum summary:")
    for table_name, rows in data.items():
        print(f"  {table_name}: {len(rows)} rows")

    print("\nChapter breakdown:")
    chapters = data["finger_chapters"]
    lessons = data["finger_lessons"]
    units = data["finger_units"]

    unit_map = {u["id"]: u["name_en"] for u in units}
    lesson_count: dict[int, int] = {}
    for lesson in lessons:
        lesson_count[lesson["chapter_id"]] = lesson_count.get(lesson["chapter_id"], 0) + 1

    current_unit_id = None
    for ch in chapters:
        if ch["unit_id"] != current_unit_id:
            current_unit_id = ch["unit_id"]
            print(f"\n  Unit {current_unit_id}: {unit_map[current_unit_id]}")
        n = lesson_count.get(ch["id"], 0)
        print(f"    Chapter {ch['order_index']:>2}: {ch['name_en']:<30}  {n} lessons  ({ch['description_en']})")


def seed_curriculum(wipe: bool = False) -> None:
    data = _build_curriculum()
    _print_summary(data)

    tables = Base.metadata.tables

    with SessionLocal.begin() as db:
        if wipe:
            _wipe_curriculum(db)

        # Upsert in foreign-key dependency order
        _upsert(db, tables["finger_letters"], data["finger_letters"])
        _upsert(db, tables["finger_units"], data["finger_units"])
        _upsert(db, tables["finger_chapters"], data["finger_chapters"])
        _upsert(db, tables["finger_lessons"], data["finger_lessons"])
        _upsert(db, tables["finger_lesson_letters"], data["finger_lesson_letters"])

    total_letters = len(data["finger_letters"])
    total_lessons = len(data["finger_lessons"])
    print(
        f"\nSeeded {len(data['finger_units'])} units, "
        f"{len(data['finger_chapters'])} chapters, "
        f"{total_lessons} lessons, "
        f"{total_letters} letters successfully."
    )


# ── CLI ───────────────────────────────────────────────────────────────────────

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Seed the Khmer finger spelling curriculum into the database."
    )
    parser.add_argument(
        "--wipe",
        action="store_true",
        help=(
            "Truncate curriculum tables before seeding. "
            "WARNING: this also removes all user progress data (CASCADE)."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the curriculum summary without writing to the database.",
    )
    return parser


def main() -> None:
    _configure_stdio_utf8()
    args = _build_parser().parse_args()

    if args.dry_run:
        data = _build_curriculum()
        _print_summary(data)
        print("\nDry run complete — no changes written.")
        return

    seed_curriculum(wipe=args.wipe)


if __name__ == "__main__":
    main()
