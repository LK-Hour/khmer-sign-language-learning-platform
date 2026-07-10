"""Refactor exercise tables for both tracks

- Exercises: remove publish cols + correct_answer, rename explanation -> description, add unit_id + lesson_count
- Exercise options: add updated_at
- Exercise results: rename tables to exercise_progress, remove progress_id/time_taken/answered_at,
  rename selected_option_id -> selected_answer_id, attempt_number -> attempts, add updated_at

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


def upgrade() -> None:
    # ════════════════════════════════════════════════════════════════════════
    # FINGER EXERCISES
    # ════════════════════════════════════════════════════════════════════════
    # Drop publish columns
    op.drop_column("finger_exercises", "publish_status")
    op.drop_column("finger_exercises", "published_at")
    op.drop_column("finger_exercises", "published_by")
    # Drop correct_answer
    op.drop_column("finger_exercises", "correct_answer")
    # Rename explanation -> description
    op.alter_column("finger_exercises", "explanation_en", new_column_name="description_en")
    op.alter_column("finger_exercises", "explanation_kh", new_column_name="description_kh")
    # Add unit_id (after id — column order is logical only, PG appends at end)
    op.add_column("finger_exercises", sa.Column("unit_id", sa.BigInteger(), sa.ForeignKey("finger_units.id"), nullable=True))
    # Backfill unit_id from chapter hierarchy: exercise -> lesson -> chapter -> unit
    op.execute("""
        UPDATE finger_exercises fe
        SET unit_id = fc.unit_id
        FROM finger_lessons fl
        JOIN finger_chapters fc ON fl.chapter_id = fc.id
        WHERE fe.lesson_id = fl.id
    """)
    op.alter_column("finger_exercises", "unit_id", nullable=False)
    op.create_index("ix_finger_exercises_unit_id", "finger_exercises", ["unit_id"])
    # Add lesson_count
    op.add_column("finger_exercises", sa.Column("lesson_count", sa.BigInteger(), nullable=False, server_default="5"))

    # ════════════════════════════════════════════════════════════════════════
    # WORD DETECTION EXERCISES
    # ════════════════════════════════════════════════════════════════════════
    op.drop_column("word_detection_exercises", "publish_status")
    op.drop_column("word_detection_exercises", "published_at")
    op.drop_column("word_detection_exercises", "published_by")
    op.drop_column("word_detection_exercises", "correct_answer")
    op.alter_column("word_detection_exercises", "explanation_en", new_column_name="description_en")
    op.alter_column("word_detection_exercises", "explanation_kh", new_column_name="description_kh")
    op.add_column("word_detection_exercises", sa.Column("unit_id", sa.BigInteger(), sa.ForeignKey("word_detection_units.id"), nullable=True))
    op.execute("""
        UPDATE word_detection_exercises we
        SET unit_id = wc.unit_id
        FROM word_detection_lessons wl
        JOIN word_detection_chapters wc ON wl.chapter_id = wc.id
        WHERE we.lesson_id = wl.id
    """)
    op.alter_column("word_detection_exercises", "unit_id", nullable=False)
    op.create_index("ix_word_detection_exercises_unit_id", "word_detection_exercises", ["unit_id"])
    op.add_column("word_detection_exercises", sa.Column("lesson_count", sa.BigInteger(), nullable=False, server_default="5"))

    # ════════════════════════════════════════════════════════════════════════
    # FINGER EXERCISE OPTIONS — add updated_at
    # ════════════════════════════════════════════════════════════════════════
    op.add_column("finger_exercise_options", sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()))

    # ════════════════════════════════════════════════════════════════════════
    # WORD DETECTION EXERCISE OPTIONS — add updated_at
    # ════════════════════════════════════════════════════════════════════════
    op.add_column("word_detection_exercise_options", sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()))

    # ════════════════════════════════════════════════════════════════════════
    # FINGER USER EXERCISE RESULTS → FINGER EXERCISE PROGRESS
    # ════════════════════════════════════════════════════════════════════════
    # Drop old indexes first (before table rename)
    op.drop_index("ix_finger_user_exercise_results_user_id", table_name="finger_user_exercise_results")
    op.drop_index("ix_finger_user_exercise_results_progress_id", table_name="finger_user_exercise_results")
    op.drop_index("ix_finger_user_exercise_results_exercise_id", table_name="finger_user_exercise_results")
    # Drop old columns
    op.drop_column("finger_user_exercise_results", "progress_id")
    op.drop_column("finger_user_exercise_results", "time_taken")
    op.drop_column("finger_user_exercise_results", "answered_at")
    # Rename columns
    op.alter_column("finger_user_exercise_results", "selected_option_id", new_column_name="selected_answer_id")
    op.alter_column("finger_user_exercise_results", "attempt_number", new_column_name="attempts")
    # Add updated_at
    op.add_column("finger_user_exercise_results", sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()))
    # Rename table
    op.rename_table("finger_user_exercise_results", "finger_exercise_progress")
    # Create new indexes
    op.create_index("ix_finger_exercise_progress_user_id", "finger_exercise_progress", ["user_id"])
    op.create_index("ix_finger_exercise_progress_exercise_id", "finger_exercise_progress", ["finger_exercise_id"])

    # ════════════════════════════════════════════════════════════════════════
    # WORD DETECTION USER EXERCISE RESULTS → WORD DETECTION EXERCISE PROGRESS
    # ════════════════════════════════════════════════════════════════════════
    # Drop old indexes first (before table rename)
    op.drop_index("ix_word_detection_user_exercise_results_user_id", table_name="word_detection_user_exercise_results")
    op.drop_index("ix_word_detection_user_exercise_results_progress_id", table_name="word_detection_user_exercise_results")
    op.drop_index("ix_word_detection_user_exercise_results_exercise_id", table_name="word_detection_user_exercise_results")
    # Drop old columns
    op.drop_column("word_detection_user_exercise_results", "progress_id")
    op.drop_column("word_detection_user_exercise_results", "time_taken")
    op.drop_column("word_detection_user_exercise_results", "answered_at")
    # Rename columns
    op.alter_column("word_detection_user_exercise_results", "selected_option_id", new_column_name="selected_answer_id")
    op.alter_column("word_detection_user_exercise_results", "attempt_number", new_column_name="attempts")
    # Add updated_at
    op.add_column("word_detection_user_exercise_results", sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()))
    # Rename table
    op.rename_table("word_detection_user_exercise_results", "word_detection_exercise_progress")
    # Create new indexes
    op.create_index("ix_word_detection_exercise_progress_user_id", "word_detection_exercise_progress", ["user_id"])
    op.create_index("ix_word_detection_exercise_progress_exercise_id", "word_detection_exercise_progress", ["word_detection_exercise_id"])


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
