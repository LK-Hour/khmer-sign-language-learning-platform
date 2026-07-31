"""Refactor exercise tables for both tracks

- Exercises: remove publish cols + correct_answer, rename explanation -> description, add unit_id + lesson_count
- Exercise options: add updated_at
- Exercise results: rename tables to exercise_progress, remove progress_id/time_taken/answered_at,
  rename selected_option_id -> selected_answer_id, attempt_number -> attempts, add updated_at

Idempotent where overlapping with sibling branch a4b6c8d2e0f1 (unit_id / updated_at already applied).

Revision ID: b4c6d8e0f2a3
Revises: a3b5c7d9e1f2
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "b4c6d8e0f2a3"
down_revision: Union[str, None] = "a3b5c7d9e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    insp = sa.inspect(op.get_bind())
    # SQLAlchemy caches reflection; clear after prior DDL in this migration.
    if hasattr(insp, "clear_cache"):
        insp.clear_cache()
    return insp


def _table_names() -> set[str]:
    return set(_inspector().get_table_names())


def _columns(table: str) -> set[str]:
    insp = _inspector()
    if table not in set(insp.get_table_names()):
        return set()
    return {c["name"] for c in insp.get_columns(table)}


def _indexes(table: str) -> set[str]:
    insp = _inspector()
    if table not in set(insp.get_table_names()):
        return set()
    return {i["name"] for i in insp.get_indexes(table)}


def _drop_column_if_exists(table: str, column: str) -> None:
    if column in _columns(table):
        op.drop_column(table, column)


def _rename_column_if_needed(table: str, old: str, new: str) -> None:
    cols = _columns(table)
    if old in cols and new not in cols:
        op.alter_column(table, old, new_column_name=new)


def _add_column_if_missing(table: str, column: sa.Column) -> bool:
    if column.name in _columns(table):
        return False
    op.add_column(table, column)
    return True


def _create_index_if_missing(name: str, table: str, cols: list[str]) -> None:
    if name not in _indexes(table):
        op.create_index(name, table, cols)


def _drop_index_if_exists(name: str, table: str) -> None:
    if name in _indexes(table):
        op.drop_index(name, table_name=table)


def _ensure_unit_id(table: str, fk_table: str, backfill_sql: str) -> None:
    """Add/backfill unit_id when missing (sibling a4b6 may already have done this)."""
    if "unit_id" not in _columns(table):
        op.add_column(
            table,
            sa.Column(
                "unit_id",
                sa.BigInteger(),
                sa.ForeignKey(f"{fk_table}.id"),
                nullable=True,
            ),
        )
        op.execute(backfill_sql)
        op.alter_column(table, "unit_id", nullable=False)
    _create_index_if_missing(f"ix_{table}_unit_id", table, ["unit_id"])


def _refactor_results_table(
    old_table: str,
    new_table: str,
    exercise_fk_col: str,
    old_index_prefix: str,
    new_index_prefix: str,
) -> None:
    tables = _table_names()
    if new_table in tables:
        # Already renamed (partial/re-run); ensure new indexes exist.
        _create_index_if_missing(
            f"ix_{new_index_prefix}_user_id", new_table, ["user_id"]
        )
        _create_index_if_missing(
            f"ix_{new_index_prefix}_exercise_id",
            new_table,
            [exercise_fk_col],
        )
        return
    if old_table not in tables:
        return

    _drop_index_if_exists(f"ix_{old_index_prefix}_user_id", old_table)
    _drop_index_if_exists(f"ix_{old_index_prefix}_progress_id", old_table)
    _drop_index_if_exists(f"ix_{old_index_prefix}_exercise_id", old_table)

    _drop_column_if_exists(old_table, "progress_id")
    _drop_column_if_exists(old_table, "time_taken")
    _drop_column_if_exists(old_table, "answered_at")

    _rename_column_if_needed(old_table, "selected_option_id", "selected_answer_id")
    _rename_column_if_needed(old_table, "attempt_number", "attempts")

    _add_column_if_missing(
        old_table,
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.rename_table(old_table, new_table)
    _create_index_if_missing(
        f"ix_{new_index_prefix}_user_id", new_table, ["user_id"]
    )
    _create_index_if_missing(
        f"ix_{new_index_prefix}_exercise_id",
        new_table,
        [exercise_fk_col],
    )


def upgrade() -> None:
    # ════════════════════════════════════════════════════════════════════════
    # FINGER EXERCISES
    # ════════════════════════════════════════════════════════════════════════
    _drop_column_if_exists("finger_exercises", "publish_status")
    _drop_column_if_exists("finger_exercises", "published_at")
    _drop_column_if_exists("finger_exercises", "published_by")
    _drop_column_if_exists("finger_exercises", "correct_answer")
    _rename_column_if_needed("finger_exercises", "explanation_en", "description_en")
    _rename_column_if_needed("finger_exercises", "explanation_kh", "description_kh")
    _ensure_unit_id(
        "finger_exercises",
        "finger_units",
        """
        UPDATE finger_exercises fe
        SET unit_id = fc.unit_id
        FROM finger_lessons fl
        JOIN finger_chapters fc ON fl.chapter_id = fc.id
        WHERE fe.lesson_id = fl.id
        """,
    )
    _add_column_if_missing(
        "finger_exercises",
        sa.Column("lesson_count", sa.BigInteger(), nullable=False, server_default="5"),
    )

    # ════════════════════════════════════════════════════════════════════════
    # WORD DETECTION EXERCISES
    # ════════════════════════════════════════════════════════════════════════
    _drop_column_if_exists("word_detection_exercises", "publish_status")
    _drop_column_if_exists("word_detection_exercises", "published_at")
    _drop_column_if_exists("word_detection_exercises", "published_by")
    _drop_column_if_exists("word_detection_exercises", "correct_answer")
    _rename_column_if_needed(
        "word_detection_exercises", "explanation_en", "description_en"
    )
    _rename_column_if_needed(
        "word_detection_exercises", "explanation_kh", "description_kh"
    )
    _ensure_unit_id(
        "word_detection_exercises",
        "word_detection_units",
        """
        UPDATE word_detection_exercises we
        SET unit_id = wc.unit_id
        FROM word_detection_lessons wl
        JOIN word_detection_chapters wc ON wl.chapter_id = wc.id
        WHERE we.lesson_id = wl.id
        """,
    )
    _add_column_if_missing(
        "word_detection_exercises",
        sa.Column("lesson_count", sa.BigInteger(), nullable=False, server_default="5"),
    )

    # ════════════════════════════════════════════════════════════════════════
    # EXERCISE OPTIONS — add updated_at
    # ════════════════════════════════════════════════════════════════════════
    _add_column_if_missing(
        "finger_exercise_options",
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    _add_column_if_missing(
        "word_detection_exercise_options",
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # ════════════════════════════════════════════════════════════════════════
    # USER EXERCISE RESULTS → EXERCISE PROGRESS
    # ════════════════════════════════════════════════════════════════════════
    _refactor_results_table(
        old_table="finger_user_exercise_results",
        new_table="finger_exercise_progress",
        exercise_fk_col="finger_exercise_id",
        old_index_prefix="finger_user_exercise_results",
        new_index_prefix="finger_exercise_progress",
    )
    _refactor_results_table(
        old_table="word_detection_user_exercise_results",
        new_table="word_detection_exercise_progress",
        exercise_fk_col="word_detection_exercise_id",
        old_index_prefix="word_detection_user_exercise_results",
        new_index_prefix="word_detection_exercise_progress",
    )


def downgrade() -> None:
    # ── Word Detection Exercise Progress → revert ──
    op.drop_index("ix_word_detection_exercise_progress_exercise_id", table_name="word_detection_exercise_progress")
    op.drop_index("ix_word_detection_exercise_progress_user_id", table_name="word_detection_exercise_progress")
    op.create_index("ix_word_detection_user_exercise_results_exercise_id", "word_detection_exercise_progress", ["word_detection_exercise_id"])
    op.create_index("ix_word_detection_user_exercise_results_progress_id", "word_detection_exercise_progress", ["progress_id"])
    op.create_index("ix_word_detection_user_exercise_results_user_id", "word_detection_exercise_progress", ["user_id"])
    op.drop_column("word_detection_exercise_progress", "updated_at")
    op.alter_column("word_detection_exercise_progress", "attempts", new_column_name="attempt_number")
    op.alter_column("word_detection_exercise_progress", "selected_answer_id", new_column_name="selected_option_id")
    op.add_column("word_detection_exercise_progress", sa.Column("answered_at", sa.DateTime(), server_default=sa.func.now(), nullable=False))
    op.add_column("word_detection_exercise_progress", sa.Column("time_taken", sa.BigInteger(), nullable=False, server_default="0"))
    op.add_column("word_detection_exercise_progress", sa.Column("progress_id", postgresql.UUID(as_uuid=True), nullable=False))
    op.rename_table("word_detection_exercise_progress", "word_detection_user_exercise_results")

    # ── Finger Exercise Progress → revert ──
    op.drop_index("ix_finger_exercise_progress_exercise_id", table_name="finger_exercise_progress")
    op.drop_index("ix_finger_exercise_progress_user_id", table_name="finger_exercise_progress")
    op.create_index("ix_finger_user_exercise_results_exercise_id", "finger_exercise_progress", ["finger_exercise_id"])
    op.create_index("ix_finger_user_exercise_results_progress_id", "finger_exercise_progress", ["progress_id"])
    op.create_index("ix_finger_user_exercise_results_user_id", "finger_exercise_progress", ["user_id"])
    op.drop_column("finger_exercise_progress", "updated_at")
    op.alter_column("finger_exercise_progress", "attempts", new_column_name="attempt_number")
    op.alter_column("finger_exercise_progress", "selected_answer_id", new_column_name="selected_option_id")
    op.add_column("finger_exercise_progress", sa.Column("answered_at", sa.DateTime(), server_default=sa.func.now(), nullable=False))
    op.add_column("finger_exercise_progress", sa.Column("time_taken", sa.BigInteger(), nullable=False, server_default="0"))
    op.add_column("finger_exercise_progress", sa.Column("progress_id", postgresql.UUID(as_uuid=True), nullable=False))
    op.rename_table("finger_exercise_progress", "finger_user_exercise_results")

    # ── Exercise Options — remove updated_at ──
    op.drop_column("word_detection_exercise_options", "updated_at")
    op.drop_column("finger_exercise_options", "updated_at")

    # ── Word Detection Exercises — revert ──
    op.drop_column("word_detection_exercises", "lesson_count")
    op.drop_index("ix_word_detection_exercises_unit_id", table_name="word_detection_exercises")
    op.drop_column("word_detection_exercises", "unit_id")
    op.alter_column("word_detection_exercises", "description_kh", new_column_name="explanation_kh")
    op.alter_column("word_detection_exercises", "description_en", new_column_name="explanation_en")
    op.add_column("word_detection_exercises", sa.Column("correct_answer", sa.Text(), nullable=True))
    op.add_column("word_detection_exercises", sa.Column("published_by", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("word_detection_exercises", sa.Column("published_at", sa.DateTime(), nullable=True))
    op.add_column("word_detection_exercises", sa.Column("publish_status", sa.String(20), nullable=False, server_default="published"))

    # ── Finger Exercises — revert ──
    op.drop_column("finger_exercises", "lesson_count")
    op.drop_index("ix_finger_exercises_unit_id", table_name="finger_exercises")
    op.drop_column("finger_exercises", "unit_id")
    op.alter_column("finger_exercises", "description_kh", new_column_name="explanation_kh")
    op.alter_column("finger_exercises", "description_en", new_column_name="explanation_en")
    op.add_column("finger_exercises", sa.Column("correct_answer", sa.Text(), nullable=True))
    op.add_column("finger_exercises", sa.Column("published_by", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("finger_exercises", sa.Column("published_at", sa.DateTime(), nullable=True))
    op.add_column("finger_exercises", sa.Column("publish_status", sa.String(20), nullable=False, server_default="published"))
