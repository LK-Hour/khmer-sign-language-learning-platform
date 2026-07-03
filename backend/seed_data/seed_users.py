"""Upsert demo users from seed_data.json without touching curriculum tables.

Safe to re-run: uses PostgreSQL ON CONFLICT DO UPDATE on user-related rows only.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from seed_data.seed_database import (  # noqa: E402
    DEFAULT_EXPORT_PATH,
    import_model_modules,
    load_fixture,
    upsert_rows,
)
from src.db.session import Base, SessionLocal  # noqa: E402

USER_TABLES = ("users", "user_oauth_providers", "user_sessions")


def seed_users(fixture_path: Path) -> None:
    import_model_modules()
    table_by_name = {table.name: table for table in Base.metadata.sorted_tables}
    payload = load_fixture(fixture_path)

    with SessionLocal.begin() as db:
        for name in USER_TABLES:
            table = table_by_name[name]
            rows = payload[name]
            if rows:
                upsert_rows(db, table, rows)
                print(f"  upserted {len(rows)} row(s) into {name}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Upsert demo users from seed_data.json (no curriculum wipe)."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_EXPORT_PATH,
        help="JSON fixture path (default: seed_data/seed_data.json)",
    )
    args = parser.parse_args()

    if not args.input.exists():
        raise SystemExit(f"Seed file not found: {args.input}")

    print(f"Seeding user tables from {args.input}")
    seed_users(args.input)
    print("Done.")


if __name__ == "__main__":
    main()
