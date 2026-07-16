#!/usr/bin/env python3
"""
Seed practice tables for both learning tracks (finger spelling & word detection).

Creates one practice per chapter with lesson_count=5 and links practice media
from the practice dataset folders.

Run from the backend directory:
    python seed_data/seed_practices.py
    python seed_data/seed_practices.py --wipe
    python seed_data/seed_practices.py --dry-run

Dataset locations:
    - data_set/finger_spelling_practice/  (Category/letter structure)
    - data_set/word_detection_practice/   (flat, one folder per word)
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

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

# ── Dataset paths ──────────────────────────────────────────────────────────
FINGER_PRACTICE_DIR = _project_root / "data_set" / "finger_spelling_practice"
WORD_DETECTION_PRACTICE_DIR = _project_root / "data_set" / "word_detection_practice"

MAX_LESSON_COUNT = 5


# ── Discovery ──────────────────────────────────────────────────────────────

def _discover_finger_practice_media() -> dict[str, list[Path]]:
    """
    Discover finger spelling practice media.
    Returns: { letter_kh: [path_to_png, ...] }
    Maps dataset folder names to DB letter_kh values.

    Folder structure:
        finger_spelling_practice/
          Consonants/{letter}/Main/*.png   -> letter_kh = letter
          Consonants/{letter}/Sub/*.png    -> letter_kh = ្ + letter
          Vowels/{vowel}/*.png             -> letter_kh = vowel
          Independent vowels/{folder}/*.png -> letter_kh via NAME_MAP or folder
          Diacritics/{folder}/*.png        -> letter_kh via NAME_MAP or folder
          Number/{digit}/*.png             -> letter_kh = digit
    """
    # Mapping from dataset folder names to actual DB letter_kh values
    NAME_MAP = {
        "question": "?",
    }
    # Independent vowels have special folder → DB letter mappings
    INDEPENDENT_VOWEL_NAME_MAP = {
        "អ": "ឣ",    # Dataset folder "អ" maps to independent vowel ឣ (U+17A3)
        "អា": "ឤ",   # Dataset uses two chars (អ+ា), DB uses single codepoint ឤ (U+17A4)
    }

    result: dict[str, list[Path]] = {}
    if not FINGER_PRACTICE_DIR.exists():
        return result

    consonants_dir = FINGER_PRACTICE_DIR / "Consonants"
    vowels_dir = FINGER_PRACTICE_DIR / "Vowels"
    independent_vowels_dir = FINGER_PRACTICE_DIR / "Independent vowels"
    diacritics_dir = FINGER_PRACTICE_DIR / "Diacritics"
    numbers_dir = FINGER_PRACTICE_DIR / "Number"

    # Consonants: {letter}/Main/*.png and {letter}/Sub/*.png
    if consonants_dir.exists():
        for letter_dir in sorted(consonants_dir.iterdir()):
            if not letter_dir.is_dir():
                continue
            letter_kh = letter_dir.name

            main_dir = letter_dir / "Main"
            if main_dir.exists():
                pngs = sorted(main_dir.glob("*.png"))
                if pngs:
                    result.setdefault(letter_kh, []).extend(pngs)

            sub_dir = letter_dir / "Sub"
            if sub_dir.exists():
                pngs = sorted(sub_dir.glob("*.png"))
                if pngs:
                    sub_letter = "្" + letter_kh
                    result.setdefault(sub_letter, []).extend(pngs)

    # Vowels, Independent vowels, Diacritics, Numbers: {folder}/*.png
    for category_dir in (vowels_dir, independent_vowels_dir, diacritics_dir, numbers_dir):
        if not category_dir.exists():
            continue
        # Use the independent vowel map only for that category
        name_map = INDEPENDENT_VOWEL_NAME_MAP if category_dir == independent_vowels_dir else NAME_MAP
        for letter_dir in sorted(category_dir.iterdir()):
            if not letter_dir.is_dir():
                continue
            folder_name = letter_dir.name
            letter_kh = name_map.get(folder_name, folder_name)

            pngs = sorted(letter_dir.glob("*.png"))
            if pngs:
                result.setdefault(letter_kh, []).extend(pngs)

    return result


def _discover_word_detection_practice_media() -> dict[str, list[Path]]:
    """
    Discover word detection practice media.
    Returns: { word_kh: [path_to_png, ...] }
    """
    result: dict[str, list[Path]] = {}
    if not WORD_DETECTION_PRACTICE_DIR.exists():
        return result
    for word_dir in sorted(WORD_DETECTION_PRACTICE_DIR.iterdir()):
        if not word_dir.is_dir():
            continue
        word_kh = word_dir.name
        pngs = sorted(word_dir.glob("*.png"))
        if pngs:
            result[word_kh] = pngs
    return result


# ── Seeding logic ──────────────────────────────────────────────────────────

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


def seed_finger_practices(db, media_map: dict[str, list[Path]], media_id_offset: int) -> int:
    """
    Seed finger_practices and finger_practice_medias.
    Creates one practice per chapter, then links media for each letter
    that belongs to lessons in that chapter.
    Returns the next available media_id.
    """
    from src.models.finger_spelling import (
        FingerChapter, FingerLesson, FingerLessonLetter, FingerLetter,
    )

    tables = Base.metadata.tables

    # Fetch chapters
    chapters = db.execute(
        text("SELECT id FROM finger_chapters ORDER BY id")
    ).fetchall()

    practice_rows: list[dict] = []
    media_rows: list[dict] = []
    practice_media_rows: list[dict] = []

    practice_id = 1
    media_id = media_id_offset + 1
    practice_media_id = 1

    for ch in chapters:
        chapter_id = ch[0]

        # Get all letters taught in this chapter's lessons
        letter_rows = db.execute(text("""
            SELECT DISTINCT fl.letter_kh
            FROM finger_lesson_letters fll
            JOIN finger_lessons fls ON fll.lesson_id = fls.id
            JOIN finger_letters fl ON fll.letter_id = fl.id
            WHERE fls.chapter_id = :chapter_id
        """), {"chapter_id": chapter_id}).fetchall()
        letter_names = {row[0] for row in letter_rows}

        practice_rows.append({
            "id": practice_id,
            "chapter_id": chapter_id,
            "lesson_count": MAX_LESSON_COUNT,
            "is_active": True,
        })

        # Link practice media for letters in this chapter
        for letter_kh in sorted(letter_names):
            if letter_kh not in media_map:
                continue
            for png_path in media_map[letter_kh]:
                try:
                    file_url = str(png_path.relative_to(_project_root))
                except ValueError:
                    file_url = str(png_path)

                media_rows.append({
                    "id": media_id,
                    "media_type": "image",
                    "file_url": file_url,
                })
                practice_media_rows.append({
                    "id": practice_media_id,
                    "practice_id": practice_id,
                    "media_id": media_id,
                })
                media_id += 1
                practice_media_id += 1

        practice_id += 1

    # Insert
    _upsert(db, tables["medias"], media_rows)
    _upsert(db, tables["finger_practices"], practice_rows)
    _upsert(db, tables["finger_practice_medias"], practice_media_rows)

    print(f"  finger_practices: {len(practice_rows)} rows")
    print(f"  finger_practice_medias: {len(practice_media_rows)} rows")
    print(f"  medias (finger practice): {len(media_rows)} rows")

    return media_id


def seed_word_detection_practices(db, media_map: dict[str, list[Path]], media_id_offset: int) -> int:
    """
    Seed word_detection_practices and word_detection_practice_medias.
    Creates one practice per chapter, then links media for each word
    that belongs to lessons in that chapter.
    Returns the next available media_id.
    """
    tables = Base.metadata.tables

    # Fetch chapters
    chapters = db.execute(
        text("SELECT id FROM word_detection_chapters ORDER BY id")
    ).fetchall()

    practice_rows: list[dict] = []
    media_rows: list[dict] = []
    practice_media_rows: list[dict] = []

    practice_id = 1
    media_id = media_id_offset + 1
    practice_media_id = 1

    for ch in chapters:
        chapter_id = ch[0]

        # Get all words taught in this chapter's lessons
        word_rows = db.execute(text("""
            SELECT DISTINCT ww.word_kh
            FROM word_detection_lesson_words wlw
            JOIN word_detection_lessons wl ON wlw.lesson_id = wl.id
            JOIN word_detection_words ww ON wlw.word_id = ww.id
            WHERE wl.chapter_id = :chapter_id
        """), {"chapter_id": chapter_id}).fetchall()
        word_names = {row[0] for row in word_rows}

        practice_rows.append({
            "id": practice_id,
            "chapter_id": chapter_id,
            "lesson_count": MAX_LESSON_COUNT,
            "is_active": True,
        })

        # Link practice media for words in this chapter
        for word_kh in sorted(word_names):
            if word_kh not in media_map:
                continue
            for png_path in media_map[word_kh]:
                try:
                    file_url = str(png_path.relative_to(_project_root))
                except ValueError:
                    file_url = str(png_path)

                media_rows.append({
                    "id": media_id,
                    "media_type": "image",
                    "file_url": file_url,
                })
                practice_media_rows.append({
                    "id": practice_media_id,
                    "practice_id": practice_id,
                    "media_id": media_id,
                })
                media_id += 1
                practice_media_id += 1

        practice_id += 1

    # Insert
    _upsert(db, tables["medias"], media_rows)
    _upsert(db, tables["word_detection_practices"], practice_rows)
    _upsert(db, tables["word_detection_practice_medias"], practice_media_rows)

    print(f"  word_detection_practices: {len(practice_rows)} rows")
    print(f"  word_detection_practice_medias: {len(practice_media_rows)} rows")
    print(f"  medias (word detection practice): {len(media_rows)} rows")

    return media_id


# ── Main ───────────────────────────────────────────────────────────────────

def seed_practices(wipe: bool = False, dry_run: bool = False) -> None:
    print("📁 Discovering practice media files...")

    finger_media = _discover_finger_practice_media()
    word_media = _discover_word_detection_practice_media()

    print(f"  Finger spelling: {sum(len(v) for v in finger_media.values())} images in {len(finger_media)} letter folders")
    print(f"  Word detection: {sum(len(v) for v in word_media.values())} images in {len(word_media)} word folders")

    if dry_run:
        print("\nDry run complete — no changes written.")
        return

    with SessionLocal.begin() as db:
        if wipe:
            print("\n⚠️  Wiping practice tables...")
            db.execute(text("""
                TRUNCATE TABLE
                    finger_practice_medias,
                    word_detection_practice_medias,
                    finger_user_practice_progress,
                    word_detection_user_practice_progress,
                    finger_practices,
                    word_detection_practices
                RESTART IDENTITY CASCADE
            """))
            # Also remove practice media entries
            db.execute(text("""
                DELETE FROM medias
                WHERE media_type = 'image'
                AND (
                    file_url LIKE '%finger_spelling_practice%'
                    OR file_url LIKE '%word_detection_practice%'
                    OR file_url LIKE '%word_detection_prtactice%'
                )
            """))
            print("  Practice tables wiped.")

        # Get current max media ID to avoid conflicts
        max_media_id = db.execute(
            text("SELECT COALESCE(MAX(id), 0) FROM medias")
        ).scalar() or 0

        print("\n🌱 Seeding finger spelling practices...")
        next_media_id = seed_finger_practices(db, finger_media, max_media_id)

        print("\n🌱 Seeding word detection practices...")
        seed_word_detection_practices(db, word_media, next_media_id - 1)

        # Reset sequences after inserting with explicit IDs
        from seed_data.reset_sequences import reset_all_sequences
        print("\n🔄 Resetting sequences...")
        reset_all_sequences(db)

    print("\n✅ Practice seeding complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed practice tables for both learning tracks")
    parser.add_argument("--wipe", action="store_true", help="Wipe practice tables before seeding")
    parser.add_argument("--dry-run", action="store_true", help="Only show what would be inserted")
    args = parser.parse_args()
    seed_practices(wipe=args.wipe, dry_run=args.dry_run)
