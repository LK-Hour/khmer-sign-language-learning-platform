"""Scalable seed/export utility for the backend database.

The script supports two main workflows:
- export the current database state into a JSON fixture file
- import that JSON fixture back into a database using idempotent upserts

This is designed to stay useful as the tables grow:
- rows are processed in chunks
- imports are safe to re-run
- exported fixtures preserve foreign-key relationships by keeping ids
"""

from __future__ import annotations

import argparse
import json
import pkgutil
import sys
from importlib import import_module
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable
from uuid import UUID

from dotenv import load_dotenv
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

import src.models as models_package  # noqa: E402
from src.db.session import Base, SessionLocal  # noqa: E402


def import_model_modules() -> None:
    for module_info in pkgutil.iter_modules(models_package.__path__, models_package.__name__ + "."):
        import_module(module_info.name)


import_model_modules()

DEFAULT_EXPORT_PATH = Path(__file__).with_name("seed_data.json")
BATCH_SIZE = 1000
MANAGED_TABLES = list(Base.metadata.sorted_tables)


def chunked(items: Iterable[dict[str, Any]], size: int) -> Iterable[list[dict[str, Any]]]:
    batch: list[dict[str, Any]] = []
    for item in items:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


def serialize_value(value: Any) -> Any:
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def serialize_row(row: Any) -> dict[str, Any]:
    return {
        key: serialize_value(value)
        for key, value in row.items()
    }


def iter_table_rows(db, table, batch_size: int) -> Iterable[dict[str, Any]]:
    primary_key_columns = list(table.primary_key.columns)
    statement = select(table)
    if primary_key_columns:
        statement = statement.order_by(*primary_key_columns)
    for row in db.execute(statement).yield_per(batch_size).mappings():
        yield serialize_row(row)


def export_database(output_path: Path, batch_size: int) -> None:
    with SessionLocal() as db, output_path.open("w", encoding="utf-8") as handle:
        handle.write("{\n")
        for table_index, table in enumerate(MANAGED_TABLES):
            if table_index:
                handle.write(",\n")
            handle.write(f'  "{table.name}": [\n')

            row_index = 0
            for row in iter_table_rows(db, table, batch_size):
                if row_index:
                    handle.write(",\n")
                handle.write("    ")
                handle.write(json.dumps(row, ensure_ascii=False))
                row_index += 1

            handle.write("\n  ]")

        handle.write("\n}\n")


def load_fixture(path: Path) -> dict[str, list[dict[str, Any]]]:
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if not isinstance(payload, dict):
        raise ValueError("Seed file must contain a JSON object at the top level")

    normalized: dict[str, list[dict[str, Any]]] = {}
    for table in MANAGED_TABLES:
        rows = payload.get(table.name, [])
        if rows is None:
            rows = []
        if not isinstance(rows, list):
            raise ValueError(f'Expected "{table.name}" to be a JSON array')
        normalized[table.name] = rows

    return normalized


def wipe_tables(db) -> None:
    if not MANAGED_TABLES:
        return

    table_names = ", ".join(table.name for table in MANAGED_TABLES)
    db.execute(text(f"TRUNCATE TABLE {table_names} RESTART IDENTITY CASCADE"))


def upsert_rows(db, table, rows: list[dict[str, Any]]) -> int:
    if not rows:
        return 0

    statement = pg_insert(table).values(rows)
    conflict_columns = [column.name for column in table.primary_key.columns]
    if not conflict_columns:
        raise ValueError(f"Table {table.name} must have a primary key to be seeded safely")

    excluded_columns = set(conflict_columns)
    update_columns = {
        column.name: getattr(statement.excluded, column.name)
        for column in table.columns
        if column.name not in excluded_columns
    }

    statement = statement.on_conflict_do_update(
        index_elements=conflict_columns,
        set_=update_columns,
    )

    db.execute(statement)
    return len(rows)


def import_fixture(path: Path, batch_size: int, wipe: bool) -> None:
    payload = load_fixture(path)

    with SessionLocal.begin() as db:
        if wipe:
            wipe_tables(db)

        for table in MANAGED_TABLES:
            rows = payload[table.name]
            for batch in chunked(rows, batch_size):
                upsert_rows(db, table, batch)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Export or seed the backend database in a repeatable way."
    )
    parser.add_argument(
        "--export",
        action="store_true",
        help="Export the current database into a JSON fixture file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_EXPORT_PATH,
        help="Output path for exported JSON or input path for imported JSON.",
    )
    parser.add_argument(
        "--wipe",
        action="store_true",
        help="Truncate the managed tables before importing the fixture.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=BATCH_SIZE,
        help="Number of rows to process per batch.",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.batch_size <= 0:
        raise SystemExit("--batch-size must be greater than 0")

    if args.export:
        export_database(args.output, args.batch_size)
        print(f"Exported database snapshot to {args.output}")
        return

    if not args.output.exists():
        raise SystemExit(
            f"Seed file not found: {args.output}. "
            "Run with --export first or create a JSON fixture at that path."
        )

    import_fixture(args.output, args.batch_size, args.wipe)
    print(f"Seeded database from {args.output}")


if __name__ == "__main__":
    main()