"""Reset all PostgreSQL sequences to match the current max ID in each table.

This must be run after any seed/import operation that inserts rows with
explicit primary key values, otherwise the auto-increment sequence will be
out of sync and the next INSERT without an explicit ID will fail with a
UniqueViolation.

Can be used standalone:
    python seed_data/reset_sequences.py

Or imported and called programmatically:
    from seed_data.reset_sequences import reset_all_sequences
"""

from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

from src.db.session import SessionLocal  # noqa: E402


def reset_all_sequences(db=None) -> list[str]:
    """Reset all serial/identity sequences to max(id) for each table.

    Args:
        db: Optional existing SQLAlchemy session. If None, creates its own.

    Returns:
        List of messages describing what was reset.
    """
    query = text("""
        SELECT
            sequencename,
            pg_get_serial_sequence(split_part(sequencename, '_id_seq', 1), 'id') AS full_seq,
            split_part(sequencename, '_id_seq', 1) AS table_name
        FROM pg_sequences
        WHERE schemaname = 'public'
          AND sequencename LIKE '%_id_seq'
    """)

    # More robust: query pg_class for all sequences and their owning columns
    robust_query = text("""
        SELECT
            t.relname AS table_name,
            a.attname AS column_name,
            s.relname AS sequence_name
        FROM pg_class s
        JOIN pg_depend d ON d.objid = s.oid
        JOIN pg_class t ON t.oid = d.refobjid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
        WHERE s.relkind = 'S'
          AND t.relkind = 'r'
          AND d.deptype = 'a'
    """)

    messages: list[str] = []

    def _run(session):
        rows = session.execute(robust_query).fetchall()
        for table_name, column_name, sequence_name in rows:
            result = session.execute(
                text(
                    f"SELECT setval('{sequence_name}', COALESCE((SELECT MAX({column_name}) FROM {table_name}), 1))"
                )
            )
            new_val = result.scalar()
            messages.append(f"  {sequence_name} -> {new_val}")
        return messages

    if db is not None:
        _run(db)
    else:
        with SessionLocal.begin() as session:
            _run(session)

    return messages


if __name__ == "__main__":
    print("🔄 Resetting all sequences to match current max IDs...")
    msgs = reset_all_sequences()
    for msg in msgs:
        print(msg)
    print(f"\n✅ Reset {len(msgs)} sequence(s).")
