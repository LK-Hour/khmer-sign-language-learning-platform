#!/usr/bin/env python3
"""
Seed the sentence-spelling sample sentence bank.

Run from the backend directory:
    python seed_data/seed_sentence_spelling.py
    python seed_data/seed_sentence_spelling.py --wipe
    python seed_data/seed_sentence_spelling.py --dry-run

This replaces the hard-coded ``SAMPLE_SENTENCES`` array that used to live in
the frontend (``frontend/src/features/sentence-spelling/data/sampleSentences.ts``).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_backend_dir))

from dotenv import load_dotenv
load_dotenv(_backend_dir / ".env")

from sqlalchemy.dialects.postgresql import insert as pg_insert
from src.db.session import SessionLocal  # noqa: E402
from src.models.sentence_spelling import SentenceSpellingSentence  # noqa: E402

SENTENCES = [
    {"text_kh": "ខ្ញុំទៅសាលារៀន", "text_en": "I go to school"},
    {"text_kh": "គ្រូបង្រៀនខ្ញុំចិត្តល្អ", "text_en": "My teacher is kind"},
    {"text_kh": "ខ្ញុំចូលចិត្តអានសៀវភៅ", "text_en": "I like to read books"},
    {"text_kh": "ខ្ញុំធ្វើកិច្ចការផ្ទះរាល់ថ្ងៃ", "text_en": "I do my homework every day"},
    {"text_kh": "ថ្នាក់រៀនរបស់ខ្ញុំស្អាត", "text_en": "My classroom is clean"},
    {"text_kh": "ខ្ញុំរៀនភាសាខ្មែរ", "text_en": "I study the Khmer language"},
]


def seed_sentence_spelling(wipe: bool = False, dry_run: bool = False) -> None:
    db = SessionLocal()
    try:
        if dry_run:
            print(f"[dry-run] Would upsert {len(SENTENCES)} sentences:")
            for row in SENTENCES:
                print(f"  - {row['text_kh']} ({row['text_en']})")
            return

        if wipe:
            deleted = db.query(SentenceSpellingSentence).delete()
            print(f"Wiped {deleted} existing sentence(s).")

        table = SentenceSpellingSentence.__table__
        stmt = pg_insert(table).values(SENTENCES)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_sentence_spelling_sentences_text_kh",
            set_={"text_en": stmt.excluded.text_en, "is_active": True},
        )
        db.execute(stmt)
        db.commit()
        print(f"Seeded {len(SENTENCES)} sentence(s).")
    finally:
        db.close()


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Seed the sentence-spelling sample sentences.")
    parser.add_argument("--wipe", action="store_true", help="Delete existing sentences first.")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be seeded.")
    return parser


def main() -> None:
    args = _build_parser().parse_args()
    seed_sentence_spelling(wipe=args.wipe, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
