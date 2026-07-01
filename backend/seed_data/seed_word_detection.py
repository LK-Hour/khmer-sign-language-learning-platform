#!/usr/bin/env python3
"""
Seed the Khmer Sign Language word detection curriculum.

Run order matters: seed finger spelling FIRST, then word detection.
    python seed_data/seed_curriculum.py --wipe --wipe-media   # images, media ids 1..N
    python seed_data/seed_word_detection.py --wipe            # videos, media ids N+1..

Run from the backend directory:
    python seed_data/seed_word_detection.py
    python seed_data/seed_word_detection.py --wipe   # clear word detection tables + video media first
    python seed_data/seed_word_detection.py --dry-run

Structure: Unit (category) → Chapter (level) → Lesson (word)
Mirrors the actual dataset hierarchy in docs.local/folder_structure.md:
    data_set/word_detection/{word}/*.mp4

Media ID consistency:
- Finger spelling media are images (media_type='image'), seeded first.
- Word detection media are videos (media_type='video'), seeded second.
- Video media ids are offset past the highest existing image media id, so the
  two curricula never collide. On --wipe, all video media rows are removed first
  so re-seeding always produces the same deterministic ids.
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
# Each unit = a category folder, each chapter = a level folder inside it.
# The structure mirrors docs.local/folder_structure.md.
# Words are listed per chapter in dataset order (100 words total).

CURRICULUM = [
    {
        "id": 1,
        "name_en": "Sports",
        "name_kh": "កីឡា",
        "description_en": "Sports and games",
        "description_kh": "កីឡា និងការលេង",
        "order_index": 1,
        "folder": "កីឡា",
        "chapters": [
            {
                "id": 1,
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
    {
        "id": 2,
        "name_en": "Adjectives",
        "name_kh": "គុណនាម",
        "description_en": "Adjectives",
        "description_kh": "គុណនាម",
        "order_index": 2,
        "folder": "គុណនាម",
        "chapters": [
            {
                "id": 2,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Adjectives words",
                "description_kh": "ថ្នាក់ពាក្យគុណនាម",
                "order_index": 1,
                "words": [
                    ("ក្រាស់", "Thick"),
                ],
            },
        ],
    },
    {
        "id": 3,
        "name_en": "Directions",
        "name_kh": "ទឹសដៅ",
        "description_en": "Directions",
        "description_kh": "ទឹសដៅ",
        "order_index": 3,
        "folder": "ទឹសដៅ",
        "chapters": [
            {
                "id": 3,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Core direction words",
                "description_kh": "ពាក្យទិសដៅមូលដ្ឋាន",
                "order_index": 1,
                "words": [
                    ("កើត", "East"),
                    ("ឆ្វេង", "Left"),
                    ("ជើង", "North"),
                    ("ត្បូង", "South"),
                    ("លិច", "West"),
                    ("ស្ដាំ", "Right"),
                ],
            },
            {
                "id": 4,
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
    {
        "id": 4,
        "name_en": "Pronouns",
        "name_kh": "សព្វនាម",
        "description_en": "Pronouns",
        "description_kh": "សព្វនាម",
        "order_index": 4,
        "folder": "សព្វនាម",
        "chapters": [
            {
                "id": 5,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Personal pronouns",
                "description_kh": "ពាក្យសព្វនាម",
                "order_index": 1,
                "words": [
                    ("ខ្ញុំ", "I"),
                    ("គាត់", "He/She"),
                    ("ឈ្មោះ", "Name"),
                    ("ទី", "Place"),
                    ("អ្នក", "You"),
                ],
            },
        ],
    },
    {
        "id": 5,
        "name_en": "Time and Places",
        "name_kh": "ពេលវេលានិងទីកន្លែង",
        "description_en": "Time and places",
        "description_kh": "ពេលវេលា និងទីកន្លែង",
        "order_index": 5,
        "folder": "ពេលវេលានិងទីកន្លែង",
        "chapters": [
            {
                "id": 6,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Time and calendar basics",
                "description_kh": "ពេលវេលា និងប្រតិទិន",
                "order_index": 1,
                "words": [
                    ("ខែ", "Month"),
                    ("ឆ្នាំ", "Year"),
                    ("ថ្ងៃ", "Day"),
                    ("ថ្ងៃត្រង់", "Noon"),
                    ("ផ្សារ", "Market"),
                    ("ម៉ោង", "Hour"),
                ],
            },
            {
                "id": 7,
                "name_en": "Level 2",
                "name_kh": "កម្រិត២",
                "description_en": "Specific times of day",
                "description_kh": "ពេលវេលា",
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
    {
        "id": 6,
        "name_en": "Food and Drinks",
        "name_kh": "ម្ហូបនិងភេសជ្ជៈ",
        "description_en": "Food and drinks",
        "description_kh": "ម្ហូប និងភេសជ្ជៈ",
        "order_index": 6,
        "folder": "ម្ហូបនិងភេសជ្ជៈ",
        "chapters": [
            {
                "id": 8,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Basic food vocabulary",
                "description_kh": "ពាក្យម្ហូបទូទៅ",
                "order_index": 1,
                "words": [
                    ("គុយទាវ", "Noodles"),
                    ("ម្ជូរ", "Sour"),
                ],
            },
            {
                "id": 9,
                "name_en": "Level 2",
                "name_kh": "កម្រិត២",
                "description_en": "Beverages",
                "description_kh": "ភេសជ្ជៈ",
                "order_index": 2,
                "words": [
                    ("ទឹកកក", "Ice"),
                    ("ទឹកក្រូច", "Orange juice"),
                    ("សម្លរ", "Soup"),
                ],
            },
        ],
    },
    {
        "id": 7,
        "name_en": "Daily Activities",
        "name_kh": "សកម្មភាពប្រចាំថ្ងៃ",
        "description_en": "Daily activities",
        "description_kh": "សកម្មភាពប្រចាំថ្ងៃ",
        "order_index": 7,
        "folder": "សកម្មភាពប្រចាំថ្ងៃ",
        "chapters": [
            {
                "id": 10,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Basic daily routines",
                "description_kh": "ទម្លាប់ប្រចាំថ្ងៃមូលដ្ឋាន",
                "order_index": 1,
                "words": [
                    ("កក់សក់", "Wash hair"),
                    ("គេង", "Sleep"),
                    ("ញ៉ាំ", "Eat"),
                    ("ស្ងោរ", "Boil"),
                ],
            },
            {
                "id": 11,
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
                "id": 12,
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
    {
        "id": 8,
        "name_en": "Household Items",
        "name_kh": "សម្ភារៈនៅផ្ទះ",
        "description_en": "Household items",
        "description_kh": "សម្ភារៈនៅផ្ទះ",
        "order_index": 8,
        "folder": "សម្ភារៈនៅផ្ទះ",
        "chapters": [
            {
                "id": 13,
                "name_en": "Level 1",
                "name_kh": "កម្រិត១",
                "description_en": "Basic household items",
                "description_kh": "សម្ភារៈផ្ទះមូលដ្ឋាន",
                "order_index": 1,
                "words": [
                    ("កង់", "Bicycle"),
                    ("កញ្ចក់", "Mirror"),
                    ("កាបូប", "Bag"),
                    ("កែវ", "Glass"),
                    ("គ្រែ", "Bed"),
                    ("ចាន", "Plate"),
                    ("ច្រាសដុសធ្មេញ", "Toothbrush"),
                    ("ទឹក", "Water"),
                    ("ទឹកត្រី", "Fish sauce"),
                    ("ទូរទស្សន៍", "Television"),
                    ("នាឡិកា", "Clock"),
                    ("បង្គន់", "Toilet"),
                    ("វ៉ែនតា", "Eyeglasses"),
                    ("អាវ", "Shirt"),
                ],
            },
            {
                "id": 14,
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
                    ("ទឹកសុទ្ធ", "Pure water"),
                    ("ធុងទឹក", "Water bucket"),
                    ("មុង", "Mosquito net"),
                    ("សាប៊ូ", "Soap"),
                    ("សោរ", "Lock"),
                    ("ស្បែកជើង", "Shoes"),
                    ("ឡាន", "Car"),
                    ("អំពូលភ្លើង", "Light bulb"),
                ],
            },
            {
                "id": 15,
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
                "id": 16,
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
    {
        "id": 9,
        "name_en": "Education",
        "name_kh": "អប់រំ",
        "description_en": "Education",
        "description_kh": "អប់រំ",
        "order_index": 9,
        "folder": "អប់រំ",
        "chapters": [
            {
                "id": 17,
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
                "id": 18,
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
                "id": 19,
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
]


DATASET_DIR = _project_root / "data_set" / "word_detection"


def _discover_word_media() -> dict[str, list[Path]]:
    """
    Scan flat word_detection directory where each word is a direct subfolder.
    Returns: dict[word_folder_name -> list[video_paths]]
    """
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

                # Link videos for this word
                video_files = media_structure.get(word_kh, [])
                for video_path in sorted(video_files):
                    try:
                        relative_path = video_path.relative_to(_project_root)
                        file_url = str(relative_path)
                    except ValueError:
                        file_url = str(video_path)

                    all_medias.append({
                        "id": media_id,
                        "media_type": "video",
                        "file_url": file_url,
                    })

                    all_word_medias.append({
                        "id": word_media_id,
                        "word_id": word_id,
                        "media_id": media_id,
                    })
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


def _to_khmer_numeral(n: int) -> str:
    KH_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"]
    return "".join(KH_DIGITS[int(d)] for d in str(n))


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
        cid = lesson["chapter_id"]
        lessons_by_chapter.setdefault(cid, []).append(lesson)

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
    if medias or word_medias:
        print(f"\nMedia Summary:")
        print(f"  Total media files: {len(medias)}")
        print(f"  Total word-media links: {len(word_medias)}")


def seed_word_detection(wipe: bool = False, dry_run: bool = False) -> None:
    print("📁 Discovering word detection media files...")
    media_structure = _discover_word_media()
    if not media_structure:
        print("❌ No media found. Check that data_set/word_detection/ exists and contains video files.")
        return
    total_videos = sum(len(videos) for videos in media_structure.values())
    print(f"✓ Found {total_videos} videos in {len(media_structure)} word folders")

    # Validate every dataset folder maps to a curriculum word and vice versa.
    # Catches silent mismatches such as visually-identical Unicode confusables
    # (e.g. a Sinhala vowel sign standing in for a Khmer one) that would
    # otherwise drop videos without warning.
    curriculum_words = {
        word_kh
        for unit in CURRICULUM
        for chapter in unit["chapters"]
        for word_kh, _ in chapter["words"]
    }
    folder_words = set(media_structure.keys())
    missing_folders = sorted(curriculum_words - folder_words)
    orphan_folders = sorted(folder_words - curriculum_words)
    if missing_folders or orphan_folders:
        if missing_folders:
            print("❌ Curriculum words with no matching dataset folder:")
            for w in missing_folders:
                print(f"     {w!r}  bytes={w.encode('utf-8')}")
        if orphan_folders:
            print("❌ Dataset folders not referenced by the curriculum (videos would be dropped):")
            for w in orphan_folders:
                print(f"     {w!r}  ({len(media_structure[w])} videos)  bytes={w.encode('utf-8')}")
        raise SystemExit(
            "Aborting: curriculum and dataset folders are out of sync. "
            "Fix the mismatched word strings before seeding."
        )

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
                    word_detection_user_exercise_results,
                    word_detection_user_lesson_progress,
                    word_detection_contributions,
                    word_detection_lessons,
                    word_detection_chapters,
                    word_detection_words,
                    word_detection_units
                RESTART IDENTITY CASCADE
            """))
            print("Wiped word detection tables.")
            # Remove word detection's own media (videos) so re-seeding is deterministic.
            # Finger spelling media are images and are left untouched.
            deleted = db.execute(text("DELETE FROM medias WHERE media_type = 'video'"))
            print(f"Removed word detection video media rows ({deleted.rowcount} deleted).")

        # Offset video media ids past the finger spelling image media so the two
        # curricula never collide. Based on image media specifically (not MAX(id))
        # so the offset is stable across re-runs.
        offset = db.execute(
            text("SELECT COALESCE(MAX(id), 0) FROM medias WHERE media_type = 'image'")
        ).scalar() or 0
        if offset:
            media_rows = [{k: (v + offset if k == "id" else v) for k, v in row.items()} for row in data["medias"]]
            wm_rows = [{k: (v + offset if k == "media_id" else v) for k, v in row.items()} for row in data["word_detection_word_medias"]]
            data = dict(data)
            data["medias"] = media_rows
            data["word_detection_word_medias"] = wm_rows

        print("\nSeeding database...")
        _upsert(db, tables["medias"], data["medias"])
        print(f"  ✓ Seeded {len(data['medias'])} media records (video ids offset by {offset})")
        _upsert(db, tables["word_detection_units"], data["word_detection_units"])
        print(f"  ✓ Seeded {len(data['word_detection_units'])} units")
        _upsert_words(db, tables["word_detection_words"], data["word_detection_words"])
        print(f"  ✓ Seeded {len(data['word_detection_words'])} words")
        _upsert(db, tables["word_detection_chapters"], data["word_detection_chapters"])
        print(f"  ✓ Seeded {len(data['word_detection_chapters'])} chapters")
        _upsert(db, tables["word_detection_lessons"], data["word_detection_lessons"])
        print(f"  ✓ Seeded {len(data['word_detection_lessons'])} lessons")
        _upsert(db, tables["word_detection_lesson_words"], data["word_detection_lesson_words"])
        print(f"  ✓ Seeded {len(data['word_detection_lesson_words'])} lesson-word links")
        _upsert(db, tables["word_detection_word_medias"], data["word_detection_word_medias"])
        print(f"  ✓ Seeded {len(data['word_detection_word_medias'])} word-media links")

    print(f"\n✅ Word detection curriculum seeded successfully!")
    print(f"   {len(data['word_detection_units'])} units, "
          f"{len(data['word_detection_chapters'])} chapters, "
          f"{len(data['word_detection_lessons'])} lessons, "
          f"{len(data['word_detection_words'])} words, "
          f"{len(data['medias'])} media files")


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


def _upsert_words(db, table, rows: list[dict]) -> None:
    """Special upsert for word_detection_words that handles unique word_kh constraint."""
    if not rows:
        return
    stmt = pg_insert(table).values(rows)
    pk_cols = [col.name for col in table.primary_key.columns]
    update_cols = {
        col.name: getattr(stmt.excluded, col.name)
        for col in table.columns
        if col.name not in set(pk_cols)
    }
    stmt = stmt.on_conflict_do_update(
        constraint="uq_word_detection_words_word_kh",
        set_=update_cols,
    )
    db.execute(stmt)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Seed the Khmer word detection curriculum from dataset folder.")
    parser.add_argument("--wipe", action="store_true", help="Truncate word detection tables and remove video media before seeding. WARNING: removes all word detection data.")
    parser.add_argument("--dry-run", action="store_true", help="Print summary without writing to database.")
    parser.add_argument("--dataset-dir", type=Path, default=DATASET_DIR, help=f"Path to word detection dataset (default: {DATASET_DIR})")
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
