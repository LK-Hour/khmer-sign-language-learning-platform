#!/usr/bin/env python3
"""
Seed the Khmer Sign Language finger spelling curriculum.

Run from the backend directory:
    python seed_data/seed_curriculum.py
    python seed_data/seed_curriculum.py --wipe   # clear curriculum tables first

Structure rules (1 lesson = 1 letter, 5 lessons per chapter):
  - Remainder <  4  → merge into last chapter
  - Remainder >= 4  → create a new smaller chapter

Media linking:
- This script now discovers and links images to letters automatically.
- Images are loaded from: data_set/Fingerspelling data for development/
  (Consonants, Vowels, Diacritics, Independent vowels, Number)
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from collections import defaultdict


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
# letter_en uses GD romanization per https://en.wikipedia.org/wiki/Khmer_script

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

# 23 dependent vowels in standard Khmer teaching order:
#   18 base vowels first, then 6 compound forms at the end.
#   GD values use the a-series column from Wikipedia dependent-vowel table.
DEPENDENT_VOWELS = [
    ("ា",  "a"),
    ("ិ",  "e"),
    ("ី",  "ei"),
    ("ឹ",  "oe"),     
    ("ឺ",  "eu"),
    ("ុ",  "o"),
    ("ូ",  "ou"),
    ("ួ",  "uo"),
    ("ើ",  "aeu"),
    ("ឿ",  "oea"),
    ("ៀ",  "ie"),
    ("េ",  "e"),
    ("ែ",  "ae"),
    ("ៃ",  "ai"),
    ("ោ",  "ao"),
    ("ៅ",  "au"),
    ("ុំ", "om"),
    ("ំ",  "am"),
    ("ាំ", "am"),
    ("ះ",  "ah"),
    ("ុះ", "oh"),
    ("េះ", "eh"),
    ("ោះ", "aoh"),
]

# 33 main consonants in traditional Khmer alphabet order (GD full names)
MAIN_CONSONANTS = [
    ("ក", "ka"),
    ("ខ", "kha"),
    ("គ", "ko"),
    ("ឃ", "kho"),
    ("ង", "ngo"),
    ("ច", "cha"),
    ("ឆ", "chha"),
    ("ជ", "cho"),
    ("ឈ", "chho"),
    ("ញ", "nho"),
    ("ដ", "da"),
    ("ឋ", "tha"),
    ("ឌ", "do"),
    ("ឍ", "tho"),
    ("ណ", "na"),
    ("ត", "ta"),
    ("ថ", "tha"),
    ("ទ", "to"),
    ("ធ", "tho"),
    ("ន", "no"),
    ("ប", "ba"),
    ("ផ", "pha"),
    ("ព", "po"),
    ("ភ", "pho"),
    ("ម", "mo"),
    ("យ", "yo"),
    ("រ", "ro"),
    ("ល", "lo"),
    ("វ", "vo"),
    ("ស", "sa"),
    ("ហ", "ha"),
    ("ឡ", "la"),
    ("អ", "'a"),
]

# 32 sub-consonants (coeng / cheung âksâr) — ឡ has no subscript form
SUB_CONSONANTS = [
    ("្ក", "sub ka"),
    ("្ខ", "sub kha"),
    ("្គ", "sub ko"),
    ("្ឃ", "sub kho"),
    ("្ង", "sub ngo"),
    ("្ច", "sub cha"),
    ("្ឆ", "sub chha"),
    ("្ជ", "sub cho"),
    ("្ឈ", "sub chho"),
    ("្ញ", "sub nho"),
    ("្ដ", "sub da"),
    ("្ឋ", "sub tha"),
    ("្ឌ", "sub do"),
    ("្ឍ", "sub tho"),
    ("្ណ", "sub na"),
    ("្ត", "sub ta"),
    ("្ថ", "sub tha"),
    ("្ទ", "sub to"),
    ("្ធ", "sub tho"),
    ("្ន", "sub no"),
    ("្ប", "sub ba"),
    ("្ផ", "sub pha"),
    ("្ព", "sub po"),
    ("្ភ", "sub pho"),
    ("្ម", "sub mo"),
    ("្យ", "sub yo"),
    ("្រ", "sub ro"),
    ("្ល", "sub lo"),
    ("្វ", "sub vo"),
    ("្ស", "sub sa"),
    ("្ហ", "sub ha"),
    ("្អ", "sub 'a"),
]

# 15 diacritics, punctuation, and special signs (វណ្ណយុត្តិ)
# Khmer names romanized per Wikipedia diacritics / punctuation tables
DIACRITICS = [
    ("់", "bânták"), 
    ("៉", "musĕkâtônd"),
    ("៊", "treisăpt"),
    ("៌", "rôbat"),
    ("៍", "tôndôkhéad"),
    ("៎", "kakâbat"),
    ("៏", "âsda"),
    ("័", "sâmyoŭk sânhnhéa"),
    ("។", "khând"),
    ("។ល។", "lăk"),
    ("៖", "châmnŏch pir kus"),
    ("ៗ", "lékh toŭ"),
    ("៚", "koŭmutr"),
    ("!", "exclamation mark"),
    ("?", "question mark"),
]

# 14 independent vowels (ស្រៈពេញតួ)
# letter_en uses GD romanization per https://en.wikipedia.org/wiki/Khmer_script#Independent_vowels
# U+17A3 ឣ and U+17A4 ឤ are deprecated code points (dataset folders "អ" / "អា")
INDEPENDENT_VOWELS = [
    ("ឣ", "a"),       # dataset folder: "អ" (not in Wikipedia table; inherent-a form)
    ("ឤ", "aa"),      # dataset folder: "អា"
    ("ឥ", "e"),
    ("ឦ", "ei"),
    ("ឧ", "o"),
    ("ឩ", "ou"),
    ("ឫ", "rue"),
    ("ឬ", "rueu"),
    ("ឭ", "lue"),
    ("ឮ", "lueu"),
    ("ឯ", "ae"),
    ("ឰ", "ai"),
    ("ឱ", "ao"),
    ("ឳ", "au"),
]

# ── Unit definitions ──────────────────────────────────────────────────────────

UNITS_META = [
    {
        "id": 1,
        "name_en": "Dependent Vowels",
        "name_kh": "ស្រៈ",
        "description_en": "Learn the 24 Khmer dependent vowel signs",
        "description_kh": "រៀនស្រៈខ្មែរ ២៤",
        "order_index": 1,
        "letters": DEPENDENT_VOWELS,
        "chapter_name_en": "Dependent Vowels",
        "chapter_name_kh": "ស្រៈ",
    },
    {
        "id": 2,
        "name_en": "Main Consonants",
        "name_kh": "ព្យញ្ជនៈ",
        "description_en": "Learn the 33 main Khmer consonants",
        "description_kh": "រៀនព្យញ្ជនៈខ្មែរ ៣៣",
        "order_index": 2,
        "letters": MAIN_CONSONANTS,
        "chapter_name_en": "Main Consonants",
        "chapter_name_kh": "ព្យញ្ជនៈ",
    },
    {
        "id": 3,
        "name_en": "Numbers",
        "name_kh": "លេខ",
        "description_en": "Learn Khmer sign language for numbers 0–9",
        "description_kh": "រៀនភាសាសញ្ញាខ្មែរសម្រាប់លេខ ០–៩",
        "order_index": 3,
        "letters": NUMBERS,
        "chapter_name_en": "Numbers",
        "chapter_name_kh": "លេខ",
    },
    {
        "id": 4,
        "name_en": "Sub Consonants",
        "name_kh": "ជើង",
        "description_en": "Learn the 32 Khmer sub-consonant​forms",
        "description_kh": "រៀនព្យញ្ជនៈខ្មែរ ជើងប្រកបទាំង ៣២",
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
        "description_kh": "រៀនស្រៈពេញតួខ្មែរទាំង ១៤",
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
      - use 5 lessons per chapter by default
      - if the final remainder is small, try to rebalance the last two chapters
      - if the combined tail would be 7 or 8 items, split it into two balanced chapters

    Examples:
      - 8 tail items  -> 4 + 4
      - 7 tail items  -> 4 + 3
      - 6 tail items  -> keep as one 6-item chapter
    """
    total = len(letters)
    remainder = total % size
    full_chapters = total // size

    groups = [letters[i * size : (i + 1) * size] for i in range(full_chapters)]

    if remainder == 0:
        return groups

    tail = letters[full_chapters * size :]

    if remainder < 4 and groups:
        combined_tail = groups.pop() + tail

        if len(combined_tail) > 6:
            split_point = (len(combined_tail) + 1) // 2
            groups.append(combined_tail[:split_point])
            groups.append(combined_tail[split_point:])
        else:
            groups.append(combined_tail)
        return groups

    groups.append(tail)
    return groups


# ── Media Discovery & Mapping ────────────────────────────────────────────────

# Mapping of folder names in data_set to Khmer letters
# Used for discovering and linking images to letters

# Consonants can be found directly by their letter (ក, ខ, etc.)
# These are already defined in MAIN_CONSONANTS and SUB_CONSONANTS

# Independent vowels folder -> letter mapping (special cases for ឣ and ឤ)
INDEPENDENT_VOWELS_FOLDER_MAP = {
    "អ": "ឣ",      # dataset folder: "អ" -> letter: ឣ
    "អា": "ឤ",     # dataset folder: "អា" -> letter: ឤ
    "ឥ": "ឥ",
    "ឦ": "ឦ",
    "ឧ": "ឧ",
    "ឩ": "ឩ",
    "ឫ": "ឫ",
    "ឬ": "ឬ",
    "ឭ": "ឭ",
    "ឮ": "ឮ",
    "ឯ": "ឯ",
    "ឰ": "ឰ",
    "ឱ": "ឱ",
    "ឳ": "ឳ",
}

# Numbers folder -> letter mapping
NUMBERS_FOLDER_MAP = {
    "០": "០",
    "១": "១",
    "២": "២",
    "៣": "៣",
    "៤": "៤",
    "៥": "៥",
    "៦": "៦",
    "៧": "៧",
    "៨": "៨",
    "៩": "៩",
}

# Diacritics folder -> letter mapping (folder names that differ from curriculum letters)
DIACRITICS_FOLDER_MAP = {
    "question": "?",
}

# Data directory paths
DATASET_DIR = Path(__file__).resolve().parents[2] / "data_set" / "Fingerspelling data for development"
CONSONANTS_DIR = DATASET_DIR / "Consonants"
VOWELS_DIR = DATASET_DIR / "Vowels"
DIACRITICS_DIR = DATASET_DIR / "Diacritics"
INDEPENDENT_VOWELS_DIR = DATASET_DIR / "Independent vowels"
NUMBERS_DIR = DATASET_DIR / "Number"


def _discover_media_files() -> dict[str, list[Path]]:
    """
    Scan the data_set directory and discover all media (image) files.
    
    Returns:
        dict[str, list[Path]]: Maps letter_kh -> list of image file paths
        
    Directory structure:
        Consonants/{letter}/Main/*.png
        Consonants/{letter}/Sub/*.png
        Vowels/{letter}/*.png
        Diacritics/{folder}/*.png
        Independent vowels/{folder}/*.png
        Number/{digit}/*.png
    """
    media_by_letter: dict[str, list[Path]] = defaultdict(list)
    
    if not DATASET_DIR.exists():
        print(f"⚠️  Data directory not found: {DATASET_DIR}")
        return media_by_letter
    
    # Scan Consonants (Main + Sub)
    if CONSONANTS_DIR.exists():
        for consonant_folder in sorted(CONSONANTS_DIR.iterdir()):
            if not consonant_folder.is_dir():
                continue
            letter_kh = consonant_folder.name
            
            # Main consonants
            main_dir = consonant_folder / "Main"
            if main_dir.exists():
                images = sorted(main_dir.glob("*.png"))
                media_by_letter[letter_kh].extend(images)
            
            # Sub consonants (letter with ្ prefix)
            sub_dir = consonant_folder / "Sub"
            if sub_dir.exists():
                images = sorted(sub_dir.glob("*.png"))
                sub_letter = "្" + letter_kh
                media_by_letter[sub_letter].extend(images)
    
    # Scan Dependent Vowels (folder name matches letter_kh)
    if VOWELS_DIR.exists():
        for vowel_folder in sorted(VOWELS_DIR.iterdir()):
            if not vowel_folder.is_dir():
                continue
            letter_kh = vowel_folder.name
            images = sorted(vowel_folder.glob("*.png"))
            media_by_letter[letter_kh].extend(images)
    
    # Scan Diacritics
    if DIACRITICS_DIR.exists():
        for diacritic_folder in sorted(DIACRITICS_DIR.iterdir()):
            if not diacritic_folder.is_dir():
                continue
            folder_name = diacritic_folder.name
            letter_kh = DIACRITICS_FOLDER_MAP.get(folder_name, folder_name)
            images = sorted(diacritic_folder.glob("*.png"))
            media_by_letter[letter_kh].extend(images)
    
    # Scan Independent Vowels
    if INDEPENDENT_VOWELS_DIR.exists():
        for vowel_folder in sorted(INDEPENDENT_VOWELS_DIR.iterdir()):
            if not vowel_folder.is_dir():
                continue
            folder_name = vowel_folder.name
            letter_kh = INDEPENDENT_VOWELS_FOLDER_MAP.get(folder_name)
            if letter_kh:
                images = sorted(vowel_folder.glob("*.png"))
                media_by_letter[letter_kh].extend(images)
    
    # Scan Numbers
    if NUMBERS_DIR.exists():
        for number_folder in sorted(NUMBERS_DIR.iterdir()):
            if not number_folder.is_dir():
                continue
            folder_name = number_folder.name
            letter_kh = NUMBERS_FOLDER_MAP.get(folder_name)
            if letter_kh:
                images = sorted(number_folder.glob("*.png"))
                media_by_letter[letter_kh].extend(images)
    
    return media_by_letter


def _build_media_records(media_by_letter: dict[str, list[Path]], letter_id_map: dict[str, int]) -> tuple[list[dict], list[dict]]:
    """
    Build Media and FingerLetterMedia records from discovered images.
    
    Args:
        media_by_letter: dict mapping letter_kh -> list of image file paths
        letter_id_map: dict mapping letter_kh -> letter_id (from _build_curriculum)
        
    Returns:
        (all_medias, all_letter_medias): Lists of dicts for Media and FingerLetterMedia tables
    """
    all_medias: list[dict] = []
    all_letter_medias: list[dict] = []
    
    media_id = 1
    letter_media_id = 1
    
    for letter_kh in sorted(media_by_letter.keys()):
        image_paths = media_by_letter[letter_kh]
        letter_id = letter_id_map.get(letter_kh)
        
        if letter_id is None:
            print(f"⚠️  Letter '{letter_kh}' not found in curriculum (skipping {len(image_paths)} images)")
            continue
        
        for image_path in image_paths:
            # Store relative path from project root for file_url
            try:
                relative_path = image_path.relative_to(Path(__file__).resolve().parents[2])
                file_url = str(relative_path)
            except ValueError:
                # Fallback to absolute path
                file_url = str(image_path)
            
            all_medias.append({
                "id": media_id,
                "media_type": "image",
                "file_url": file_url,
            })
            
            all_letter_medias.append({
                "id": letter_media_id,
                "letter_id": letter_id,
                "media_id": media_id,
            })
            
            media_id += 1
            letter_media_id += 1
    
    return all_medias, all_letter_medias


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


def _wipe_curriculum(db, wipe_media: bool = False) -> None:
    """
    Truncate curriculum tables (preserves user accounts and progress).
    
    Args:
        db: Database session
        wipe_media: If True, also wipe medias and finger_letter_medias tables
    """
    if wipe_media:
        db.execute(
            text(
                "TRUNCATE TABLE "
                "finger_letter_medias, finger_lesson_letters, finger_lessons, finger_chapters, "
                "finger_units, finger_letters, medias "
                "RESTART IDENTITY CASCADE"
            )
        )
        print("Wiped curriculum tables and media.")
    else:
        db.execute(
            text(
                "TRUNCATE TABLE "
                "finger_letter_medias, finger_lesson_letters, finger_lessons, finger_chapters, "
                "finger_units, finger_letters "
                "RESTART IDENTITY CASCADE"
            )
        )
        print("Wiped curriculum tables (media preserved).")


# ── Seed builder ──────────────────────────────────────────────────────────────

def _build_curriculum() -> dict[str, list[dict]]:
    """
    Walk UNITS_META and produce flat row lists for every curriculum table.
    Additionally discovers and links media files to letters.
    
    Returns a dict keyed by table name.
    """
    tables_meta = Base.metadata.tables

    all_letters: list[dict] = []
    all_units: list[dict] = []
    all_chapters: list[dict] = []
    all_lessons: list[dict] = []
    all_lesson_letters: list[dict] = []
    
    # Build letter_id_map for media linking
    letter_id_map: dict[str, int] = {}

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
                    "description_en": f"{unit_meta['chapter_name_en'].rstrip('s')} {first_kh} - {last_kh}",
                    "description_kh": f"{unit_meta['chapter_name_kh']} {first_kh} - {last_kh}",
                    "order_index": ch_num,
                    "is_active": True,
                }
            )

            for ltr_idx, (letter_kh, letter_en) in enumerate(group):
                all_letters.append(
                    {
                        "id": letter_id,
                        "letter_en": letter_en,
                        "letter_kh": letter_kh,
                        "description_en": None,
                        "description_kh": None,
                        "is_active": True,
                    }
                )
                
                # Store letter_id for media linking
                letter_id_map[letter_kh] = letter_id

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
    
    # Discover and build media records
    print("\n📁 Discovering media files...")
    media_by_letter = _discover_media_files()
    all_medias, all_letter_medias = _build_media_records(media_by_letter, letter_id_map)
    
    print(f"✓ Found {len(all_medias)} media files")

    return {
        "finger_letters": all_letters,
        "finger_units": all_units,
        "finger_chapters": all_chapters,
        "finger_lessons": all_lessons,
        "finger_lesson_letters": all_lesson_letters,
        "medias": all_medias,
        "finger_letter_medias": all_letter_medias,
    }


def _print_summary(data: dict[str, list[dict]]) -> None:
    print("\nCurriculum summary:")
    for table_name, rows in data.items():
        if rows:  # Only show tables with data
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
    
    # Media summary
    medias = data.get("medias", [])
    letter_medias = data.get("finger_letter_medias", [])
    if medias or letter_medias:
        print(f"\nMedia summary:")
        print(f"  Total media files: {len(medias)}")
        print(f"  Total letter-media links: {len(letter_medias)}")


def seed_curriculum(wipe: bool = False, wipe_media: bool = False) -> None:
    data = _build_curriculum()
    _print_summary(data)

    tables = Base.metadata.tables

    with SessionLocal.begin() as db:
        if wipe:
            _wipe_curriculum(db, wipe_media=wipe_media)

        # Upsert in foreign-key dependency order:
        #   medias:                  no FK deps
        #   finger_letters:          no FK deps
        #   finger_units:            no FK deps
        #   finger_chapters:         FK -> finger_units.id
        #   finger_lessons:          FK -> finger_chapters.id
        #   finger_lesson_letters:   FK -> finger_lessons.id, finger_letters.id
        #   finger_letter_medias:    FK -> finger_letters.id, medias.id
        
        _upsert(db, tables["medias"], data["medias"])
        _upsert(db, tables["finger_letters"], data["finger_letters"])
        _upsert(db, tables["finger_units"], data["finger_units"])
        _upsert(db, tables["finger_chapters"], data["finger_chapters"])
        _upsert(db, tables["finger_lessons"], data["finger_lessons"])
        _upsert(db, tables["finger_lesson_letters"], data["finger_lesson_letters"])
        _upsert(db, tables["finger_letter_medias"], data["finger_letter_medias"])

    total_letters = len(data["finger_letters"])
    total_lessons = len(data["finger_lessons"])
    total_medias = len(data["medias"])
    total_letter_medias = len(data["finger_letter_medias"])
    
    print(
        f"\n✓ Seeded {len(data['finger_units'])} units, "
        f"{len(data['finger_chapters'])} chapters, "
        f"{total_lessons} lessons, "
        f"{total_letters} letters, "
        f"{total_medias} media files, "
        f"{total_letter_medias} letter-media links successfully."
    )

    # Reset sequences after inserting with explicit IDs
    from seed_data.reset_sequences import reset_all_sequences
    print("\n🔄 Resetting sequences...")
    reset_all_sequences()
    print("✅ Sequences synced.")


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
        "--wipe-media",
        action="store_true",
        help=(
            "Also wipe media tables when using --wipe. "
            "By default, --wipe only clears curriculum tables, preserving media."
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

    seed_curriculum(wipe=args.wipe, wipe_media=args.wipe_media)


if __name__ == "__main__":
    main()
