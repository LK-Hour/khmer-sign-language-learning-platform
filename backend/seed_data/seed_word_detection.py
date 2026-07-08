#!/usr/bin/env python3
"""
Seed the Khmer Sign Language word detection curriculum.

Run order matters: seed finger spelling FIRST, then word detection.
    python seed_data/seed_curriculum.py --wipe --wipe-media
    python seed_data/seed_word_detection.py --wipe

Run from the backend directory:
    python seed_data/seed_word_detection.py
    python seed_data/seed_word_detection.py --wipe
    python seed_data/seed_word_detection.py --dry-run

Structure: Unit (category) -> Chapter (level) -> Lesson (word)
Mirrors the actual dataset hierarchy in docs/folder_structure (2).md.

Unit order:
  1. Education
  2. Directions & Places
  3. Time
  4. Pronouns & Nouns
  5. Daily Activities
  6. Food & Drinks
  7. Household Items
  8. Vehicles
  9. Sports
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def _configure_stdio_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except (OSError, ValueError, AttributeError):
                pass


_backend_dir = Path(__file__).resolve().parents[1]
_project_root = _backend_dir.parent
sys.path.insert(0, str(_backend_dir))

from dotenv import load_dotenv
load_dotenv(_backend_dir / ".env")

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from src.db.session import Base, SessionLocal  # noqa: E402

import src.models  # noqa: F401, E402
import importlib, pkgutil

for _mod in pkgutil.iter_modules(src.models.__path__, src.models.__name__ + "."):
    importlib.import_module(_mod.name)

# ── Curriculum definition ──────────────────────────────────────────────────
CURRICULUM = [
    # ── 1. Education ──────────────────────────────────────────────────────
    {
        "id": 1,
        "name_en": "Education",
        "name_kh": "អប់រំ",
        "description_en": "Education",
        "description_kh": "អប់រំ",
        "order_index": 1,
        "chapters": [
            {
                "id": 1,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "School basics",
                "description_kh": "ពាក្យសាលាមូលដ្ឋាន",
                "order_index": 1,
                "words": [
                    ("កៅអី", "Chair"),
                    ("ជ័រលុប", "Eraser"),
                    ("តុ", "Desk"),
                    ("នាយករង", "Deputy director"),
                    ("បន្ទាត់", "Ruler"),
                ],
            },
            {
                "id": 2,
                "name_en": "Level 2",
                "name_kh": "កម្រិត២",
                "description_en": "School supplies",
                "description_kh": "សម្ភារៈសិក្សា",
                "order_index": 2,
                "words": [
                    ("កាតាប", "Schoolbag"),
                    ("កាតាបស្ពាយក្រោយ", "Backpack"),
                    ("កុំព្យូទ័រ", "Computer"),
                    ("ក្ដារខៀន", "Blackboard"),
                    ("ខ្មៅដៃ", "Pencil"),
                    ("ដីស", "Chalk"),
                    ("ទឹកលុប", "Correction fluid"),
                    ("ប៊ិក", "Pen"),
                    ("លោកនាយក", "Director (male)"),
                    ("សាលារៀន", "School"),
                    ("សៀវភៅ", "Book"),
                ],
            },
            {
                "id": 3,
                "name_en": "Level 3",
                "name_kh": "កម្រិត៣",
                "description_en": "Education roles",
                "description_kh": "តួនាទីក្នុងការអប់រំ",
                "order_index": 3,
                "words": [
                    ("នាយិកា", "Director (female)"),
                    ("ប៊ិកក្រហម", "Red pen"),
                    ("ប៊ិកខៀវ", "Blue pen"),
                    ("លោកគ្រូ", "Male teacher"),
                    ("សៀវភៅពុម្ភ", "Textbook"),
                    ("ហ្វឺតក្រហម", "Red highlighter"),
                    ("ហ្វឺតខៀវ", "Blue highlighter"),
                    ("ហ្វឺតខ្មៅ", "Black highlighter"),
                    ("អ្នកគ្រូ", "Female teacher"),
                ],
            },
        ],
    },
    # ── 2. Directions & Places ────────────────────────────────────────────
    {
        "id": 2,
        "name_en": "Directions and Places",
        "name_kh": "ទឹសដៅនិងទីកន្លែង",
        "description_en": "Directions and places",
        "description_kh": "ទិសដៅ និងទីកន្លែង",
        "order_index": 2,
        "chapters": [
            {
                "id": 4,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Core direction and place words",
                "description_kh": "ពាក្យទិសដៅ និងទីកន្លែង",
                "order_index": 1,
                "words": [
                    ("កើត", "East"),
                    ("ឆ្វេង", "Left"),
                    ("ជើង", "North"),
                    ("ត្បូង", "South"),
                    ("លិច", "West"),
                    ("ស្ដាំ", "Right"),
                    ("ផ្សារ", "Market"),
                ],
            },
            {
                "id": 5,
                "name_en": "Level 2",
                "name_kh": "កម្រិត២",
                "description_en": "Position words",
                "description_kh": "ពាក្យទីតាំង",
                "order_index": 2,
                "words": [
                    ("កណ្ដាល", "Center"),
                    ("កន្លែងណា", "Where"),
                    ("ទីតាំង", "Location"),
                ],
            },
        ],
    },
    # ── 3. Time ───────────────────────────────────────────────────────────
    {
        "id": 3,
        "name_en": "Time",
        "name_kh": "ពេលវេលា",
        "description_en": "Time",
        "description_kh": "ពេលវេលា",
        "order_index": 3,
        "chapters": [
            {
                "id": 6,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Time and calendar basics",
                "description_kh": "ពេលវេលា និងប្រតិទិន",
                "order_index": 1,
                "words": [
                    ("ទី", "Ordinal / place"),
                    ("ខែ", "Month"),
                    ("ឆ្នាំ", "Year"),
                    ("ថ្ងៃ", "Day"),
                    ("ថ្ងៃត្រង់", "Noon"),
                    ("ម៉ោង", "Hour"),
                ],
            },
            {
                "id": 7,
                "name_en": "Level 2",
                "name_kh": "កម្រិត២",
                "description_en": "Specific times of day",
                "description_kh": "ពេលវេលាក្នុងថ្ងៃ",
                "order_index": 2,
                "words": [
                    ("ពេលណា", "When"),
                    ("ពេលព្រឹក", "Morning"),
                    ("ពេលយប់", "Night"),
                    ("ពេលល្ងាច", "Evening"),
                ],
            },
        ],
    },
    # ── 4. Pronouns & Nouns ───────────────────────────────────────────────
    {
        "id": 4,
        "name_en": "Pronouns and Nouns",
        "name_kh": "សព្វនាមនិងនាម",
        "description_en": "Pronouns and nouns",
        "description_kh": "សព្វនាម និងនាម",
        "order_index": 4,
        "chapters": [
            {
                "id": 8,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Personal pronouns and common nouns",
                "description_kh": "សព្វនាម និងនាម",
                "order_index": 1,
                "words": [
                    ("ខ្ញុំ", "I"),
                    ("គាត់", "He/She"),
                    ("ឈ្មោះ", "Name"),
                    ("អ្នក", "You"),
                ],
            },
        ],
    },
    # ── 5. Daily Activities ───────────────────────────────────────────────
    {
        "id": 5,
        "name_en": "Daily Activities",
        "name_kh": "សកម្មភាពប្រចាំថ្ងៃ",
        "description_en": "Daily activities",
        "description_kh": "សកម្មភាពប្រចាំថ្ងៃ",
        "order_index": 5,
        "chapters": [
            {
                "id": 9,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Basic daily routines",
                "description_kh": "ទម្លាប់ប្រចាំថ្ងៃ",
                "order_index": 1,
                "words": [
                    ("កក់សក់", "Wash hair"),
                    ("គេង", "Sleep"),
                    ("ញ៉ាំ", "Eat"),
                ],
            },
            {
                "id": 10,
                "name_en": "Level 2",
                "name_kh": "កម្រិត២",
                "description_en": "Daily errands",
                "description_kh": "ការងារប្រចាំថ្ងៃ",
                "order_index": 2,
                "words": [
                    ("ញ៉ាំបាយ", "Eat rice"),
                    ("ទិញ", "Buy"),
                    ("ផឹកទឹក", "Drink water"),
                ],
            },
            {
                "id": 11,
                "name_en": "Level 3",
                "name_kh": "កម្រិត៣",
                "description_en": "Personal care",
                "description_kh": "ការថែទាំខ្លួន",
                "order_index": 3,
                "words": [
                    ("ងូតទឹក", "Bathe"),
                ],
            },
        ],
    },
    # ── 6. Food & Drinks ──────────────────────────────────────────────────
    {
        "id": 6,
        "name_en": "Food and Drinks",
        "name_kh": "អាហារនិងភេសជ្ជៈ",
        "description_en": "Food and drinks",
        "description_kh": "អាហារ និងភេសជ្ជៈ",
        "order_index": 6,
        "chapters": [
            {
                "id": 12,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Basic food vocabulary",
                "description_kh": "ពាក្យម្ហូបទូទៅ",
                "order_index": 1,
                "words": [
                    ("គុយទាវ", "Noodles"),
                    ("ស្ងោរ", "Boil"),
                    ("ម្ជូរ", "Sour"),
                    ("ទឹក", "Water"),
                    ("ទឹកត្រី", "Fish sauce"),
                ],
            },
            {
                "id": 13,
                "name_en": "Level 2",
                "name_kh": "កម្រិត២",
                "description_en": "Beverages",
                "description_kh": "ភេសជ្ជៈ",
                "order_index": 2,
                "words": [
                    ("ទឹកកក", "Ice"),
                    ("ទឹកក្រូច", "Orange juice"),
                    ("ទឹកសុទ្ធ", "Pure water"),
                    ("សម្លរ", "Soup"),
                ],
            },
        ],
    },
    # ── 7. Household Items ────────────────────────────────────────────────
    {
        "id": 7,
        "name_en": "Household Items",
        "name_kh": "សម្ភារៈនៅផ្ទះ",
        "description_en": "Household items",
        "description_kh": "សម្ភារៈនៅផ្ទះ",
        "order_index": 7,
        "chapters": [
            {
                "id": 14,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Basic household items",
                "description_kh": "សម្ភារៈផ្ទះមូលដ្ឋាន",
                "order_index": 1,
                "words": [
                    ("ក្រាស់", "Thick"),
                    ("កញ្ចក់", "Mirror"),
                    ("កាបូប", "Bag"),
                    ("កែវ", "Glass"),
                    ("គ្រែ", "Bed"),
                    ("ចាន", "Plate"),
                    ("ច្រាសដុសធ្មេញ", "Toothbrush"),
                    ("ទូរទស្សន៍", "Television"),
                    ("នាឡិកា", "Clock"),
                    ("បង្គន់", "Toilet"),
                    ("វ៉ែនតា", "Eyeglasses"),
                    ("អាវ", "Shirt"),
                ],
            },
            {
                "id": 15,
                "name_en": "Level 2",
                "name_kh": "កម្រិត២",
                "description_en": "More household items",
                "description_kh": "សម្ភារៈផ្ទះបន្ថែម",
                "order_index": 2,
                "words": [
                    ("កង្ហារ", "Fan"),
                    ("កន្ទេល", "Mat"),
                    ("កាបូបប្រុស", "Men's bag"),
                    ("កៅស៊ូកង", "Rubber band"),
                    ("កំសៀវទឹក", "Kettle"),
                    ("ខោ", "Pants"),
                    ("ខ្សែភ្លើង", "Power cord"),
                    ("ឆ្នាំង", "Pot"),
                    ("ថូផ្កា", "Flower vase"),
                    ("ធុងទឹក", "Water bucket"),
                    ("មុង", "Mosquito net"),
                    ("សាប៊ូ", "Soap"),
                    ("សោរ", "Lock"),
                    ("ស្បែកជើង", "Shoes"),
                    ("អំពូលភ្លើង", "Light bulb"),
                ],
            },
            {
                "id": 16,
                "name_en": "Level 3",
                "name_kh": "កម្រិត៣",
                "description_en": "Kitchen and dining",
                "description_kh": "ផ្ទះបាយ",
                "order_index": 3,
                "words": [
                    ("ចានស្រាក់", "Dish rack"),
                    ("ទូ", "Cabinet"),
                ],
            },
            {
                "id": 17,
                "name_en": "Level 4",
                "name_kh": "កម្រិត៤",
                "description_en": "Bathroom and bedroom",
                "description_kh": "បន្ទប់ទឹក និងបន្ទប់គេង",
                "order_index": 4,
                "words": [
                    ("បន្ទប់ទឹក", "Bathroom"),
                    ("ភួយ", "Blanket"),
                ],
            },
        ],
    },
    # ── 8. Vehicles ───────────────────────────────────────────────────────
    {
        "id": 8,
        "name_en": "Vehicles",
        "name_kh": "យានយន្ត",
        "description_en": "Vehicles and transport",
        "description_kh": "យានយន្ត",
        "order_index": 8,
        "chapters": [
            {
                "id": 18,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Common vehicles",
                "description_kh": "យានយន្តទូទៅ",
                "order_index": 1,
                "words": [
                    ("កង់", "Bicycle"),
                ],
            },
            {
                "id": 19,
                "name_en": "Level 3",
                "name_kh": "កម្រិត៣",
                "description_en": "Motorised vehicles",
                "description_kh": "យានយន្តម៉ាស៊ីន",
                "order_index": 3,
                "words": [
                    ("ឡាន", "Car"),
                ],
            },
        ],
    },
    # ── 9. Sports ─────────────────────────────────────────────────────────
    {
        "id": 9,
        "name_en": "Sports",
        "name_kh": "កីឡា",
        "description_en": "Sports and games",
        "description_kh": "កីឡា និងការលេង",
        "order_index": 9,
        "chapters": [
            {
                "id": 20,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Sports vocabulary",
                "description_kh": "ពាក្យកីឡា",
                "order_index": 1,
                "words": [
                    ("ទាត់បាល់", "Football"),
                    ("បាល់ទះ", "Volleyball"),
                ],
            },
        ],
    },
]

DATASET_DIR = _project_root / "data_set" / "word_detection"


def _discover_word_media() -> dict[str, list[Path]]:
    media: dict[str, list[Path]] = {}
    if not DATASET_DIR.exists():
        print(f"⚠️  Data directory not found: {DATASET_DIR}")
        return {}
    for word_folder in sorted(DATASET_DIR.iterdir()):
        if not word_folder.is_dir():
            continue
        video_files = sorted(word_folder.glob("*.mp4"))
        if video_files:
            media[word_folder.name] = video_files
    return media


def _build_seed_data(media_structure: dict[str, list[Path]]) -> dict[str, list[dict]]:
    all_units: list[dict] = []
    all_chapters: list[dict] = []
    all_lessons: list[dict] = []
    all_words: list[dict] = []
    all_lesson_words: list[dict] = []
    all_word_medias: list[dict] = []
    all_medias: list[dict] = []

    lesson_id = 1
    word_id = 1
    lesson_word_id = 1
    media_id = 1
    word_media_id = 1

    for unit_meta in CURRICULUM:
        all_units.append({
            "id": unit_meta["id"],
            "name_en": unit_meta["name_en"],
            "name_kh": unit_meta["name_kh"],
            "description_en": unit_meta["description_en"],
            "description_kh": unit_meta["description_kh"],
            "order_index": unit_meta["order_index"],
            "is_active": True,
        })
        for chapter_meta in unit_meta["chapters"]:
            all_chapters.append({
                "id": chapter_meta["id"],
                "unit_id": unit_meta["id"],
                "name_en": chapter_meta["name_en"],
                "name_kh": chapter_meta["name_kh"],
                "description_en": chapter_meta["description_en"],
                "description_kh": chapter_meta["description_kh"],
                "order_index": chapter_meta["order_index"],
                "level": chapter_meta["order_index"],
                "is_active": True,
            })
            for word_index, (word_kh, word_en) in enumerate(chapter_meta["words"]):
                all_words.append({
                    "id": word_id,
                    "word_en": word_en,
                    "word_kh": word_kh,
                    "description_en": None,
                    "description_kh": None,
                    "is_active": True,
                })
                all_lessons.append({
                    "id": lesson_id,
                    "chapter_id": chapter_meta["id"],
                    "name_en": word_en,
                    "name_kh": word_kh,
                    "description_en": None,
                    "description_kh": None,
                    "order_index": word_index + 1,
                    "is_active": True,
                })
                all_lesson_words.append({
                    "id": lesson_word_id,
                    "lesson_id": lesson_id,
                    "word_id": word_id,
                    "order_index": 0,
                })
                lesson_word_id += 1

                for video_path in sorted(media_structure.get(word_kh, [])):
                    try:
                        file_url = str(video_path.relative_to(_project_root))
                    except ValueError:
                        file_url = str(video_path)
                    all_medias.append({"id": media_id, "media_type": "video", "file_url": file_url})
                    all_word_medias.append({"id": word_media_id, "word_id": word_id, "media_id": media_id})
                    media_id += 1
                    word_media_id += 1

                lesson_id += 1
                word_id += 1

    return {
        "word_detection_units": all_units,
        "word_detection_chapters": all_chapters,
        "word_detection_lessons": all_lessons,
        "word_detection_words": all_words,
        "word_detection_lesson_words": all_lesson_words,
        "word_detection_word_medias": all_word_medias,
        "medias": all_medias,
    }

def _print_summary(data: dict[str, list[dict]]) -> None:
    print("\nWord Detection Curriculum Summary:")
    for table_name, rows in data.items():
        if rows:
            print(f"  {table_name}: {len(rows)} rows")
    chapters = data.get("word_detection_chapters", [])
    units = data.get("word_detection_units", [])
    lessons = data.get("word_detection_lessons", [])
    unit_map = {u["id"]: u["name_en"] for u in units}
    lessons_by_chapter: dict[int, list] = {}
    for lesson in lessons:
        lessons_by_chapter.setdefault(lesson["chapter_id"], []).append(lesson)
    current_unit_id = None
    for ch in chapters:
        if ch["unit_id"] != current_unit_id:
            current_unit_id = ch["unit_id"]
            print(f"\n  Unit {current_unit_id}: {unit_map.get(current_unit_id, 'Unknown')}")
        ch_lessons = lessons_by_chapter.get(ch["id"], [])
        words = [l["name_kh"] for l in ch_lessons]
        print(f"    Chapter {ch['order_index']}: {ch['name_en']:<15}  {len(ch_lessons)} lessons — {', '.join(words)}")
    medias = data.get("medias", [])
    word_medias = data.get("word_detection_word_medias", [])
    print(f"\nMedia Summary:")
    print(f"  Total media files: {len(medias)}")
    print(f"  Total word-media links: {len(word_medias)}")


def _upsert(db, table, rows: list[dict]) -> None:
    if not rows:
        return
    stmt = pg_insert(table).values(rows)
    pk_cols = [col.name for col in table.primary_key.columns]
    update_cols = {col.name: getattr(stmt.excluded, col.name) for col in table.columns if col.name not in set(pk_cols)}
    stmt = stmt.on_conflict_do_update(index_elements=pk_cols, set_=update_cols)
    db.execute(stmt)


def _upsert_words(db, table, rows: list[dict]) -> None:
    if not rows:
        return
    stmt = pg_insert(table).values(rows)
    pk_cols = [col.name for col in table.primary_key.columns]
    update_cols = {col.name: getattr(stmt.excluded, col.name) for col in table.columns if col.name not in set(pk_cols)}
    stmt = stmt.on_conflict_do_update(constraint="uq_word_detection_words_word_kh", set_=update_cols)
    db.execute(stmt)


def seed_word_detection(wipe: bool = False, dry_run: bool = False) -> None:
    print("📁 Discovering word detection media files...")
    media_structure = _discover_word_media()
    if not media_structure:
        print("❌ No media found. Check that data_set/word_detection/ exists.")
        return
    total_videos = sum(len(v) for v in media_structure.values())
    print(f"✓ Found {total_videos} videos in {len(media_structure)} word folders")

    # Validate curriculum ↔ dataset folders
    curriculum_words = {w for u in CURRICULUM for ch in u["chapters"] for w, _ in ch["words"]}
    folder_words = set(media_structure.keys())
    missing = sorted(curriculum_words - folder_words)
    orphan = sorted(folder_words - curriculum_words)
    if missing or orphan:
        if missing:
            print("❌ Curriculum words with no dataset folder:")
            for w in missing:
                print(f"     {w!r}  bytes={w.encode('utf-8')}")
        if orphan:
            print("❌ Dataset folders not in curriculum (videos dropped):")
            for w in orphan:
                print(f"     {w!r}  ({len(media_structure[w])} videos)")
        raise SystemExit("Aborting: curriculum and dataset folders are out of sync.")

    data = _build_seed_data(media_structure)
    _print_summary(data)
    if dry_run:
        print("\nDry run complete — no changes written.")
        return

    tables = Base.metadata.tables
    with SessionLocal.begin() as db:
        if wipe:
            print("\n⚠️  Wiping word detection tables...")
            db.execute(text("""
                TRUNCATE TABLE
                    word_detection_exercise_options,
                    word_detection_exercises,
                    word_detection_word_medias,
                    word_detection_lesson_words,
                    word_detection_exercise_progress,
                    word_detection_user_lesson_progress,
                    word_detection_contributions,
                    word_detection_lessons,
                    word_detection_chapters,
                    word_detection_words,
                    word_detection_units
                RESTART IDENTITY CASCADE
            """))
            deleted = db.execute(text("DELETE FROM medias WHERE media_type = 'video'"))
            print(f"Wiped word detection tables. Removed {deleted.rowcount} video media rows.")

        offset = db.execute(text("SELECT COALESCE(MAX(id), 0) FROM medias WHERE media_type = 'image'")).scalar() or 0
        if offset:
            data = dict(data)
            data["medias"] = [{k: (v + offset if k == "id" else v) for k, v in r.items()} for r in data["medias"]]
            data["word_detection_word_medias"] = [{k: (v + offset if k == "media_id" else v) for k, v in r.items()} for r in data["word_detection_word_medias"]]

        print("\nSeeding database...")
        _upsert(db, tables["medias"], data["medias"])
        print(f"  ✓ {len(data['medias'])} media records (offset {offset})")
        _upsert(db, tables["word_detection_units"], data["word_detection_units"])
        print(f"  ✓ {len(data['word_detection_units'])} units")
        _upsert_words(db, tables["word_detection_words"], data["word_detection_words"])
        print(f"  ✓ {len(data['word_detection_words'])} words")
        _upsert(db, tables["word_detection_chapters"], data["word_detection_chapters"])
        print(f"  ✓ {len(data['word_detection_chapters'])} chapters")
        _upsert(db, tables["word_detection_lessons"], data["word_detection_lessons"])
        print(f"  ✓ {len(data['word_detection_lessons'])} lessons")
        _upsert(db, tables["word_detection_lesson_words"], data["word_detection_lesson_words"])
        print(f"  ✓ {len(data['word_detection_lesson_words'])} lesson-word links")
        _upsert(db, tables["word_detection_word_medias"], data["word_detection_word_medias"])
        print(f"  ✓ {len(data['word_detection_word_medias'])} word-media links")

    print(f"\n✅ Done! {len(data['word_detection_units'])} units, "
          f"{len(data['word_detection_chapters'])} chapters, "
          f"{len(data['word_detection_lessons'])} lessons, "
          f"{len(data['word_detection_words'])} words, "
          f"{len(data['medias'])} media files")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Seed the Khmer word detection curriculum.")
    parser.add_argument("--wipe", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--dataset-dir", type=Path, default=DATASET_DIR)
    return parser


def main() -> None:
    _configure_stdio_utf8()
    args = _build_parser().parse_args()
    global DATASET_DIR
    if args.dataset_dir.exists():
        DATASET_DIR = args.dataset_dir
    seed_word_detection(wipe=args.wipe, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
