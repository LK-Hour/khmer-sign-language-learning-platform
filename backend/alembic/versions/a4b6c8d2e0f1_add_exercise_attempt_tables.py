"""Add unit exercise attempt tables and update exercise type enum.

- Adds unit_id column to finger_exercises
- Replaces free_form/image_select with true_false/multiple_answer in the enum
- Creates finger_exercise_attempts and finger_exercise_attempt_answers tables
- Patches finger_exercise_options columns to match ORM when missing

Revision ID: a4b6c8d2e0f1
Revises: a3b5c7d9e1f2
Create Date: 2026-07-10 11:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a4b6c8d2e0f1"
down_revision: Union[str, None] = "a3b5c7d9e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # ── 0. Patch finger_exercise_options to match ORM model (idempotent) ──
    opt_cols = {c["name"] for c in inspector.get_columns("finger_exercise_options")}
    if "is_active" not in opt_cols:
        op.add_column(
            "finger_exercise_options",
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        )
    if "updated_at" not in opt_cols:
        op.add_column(
            "finger_exercise_options",
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
            ),
        )

    # ── 1. Add unit_id to finger_exercises (idempotent) ────────────────────
    ex_cols = {c["name"] for c in inspector.get_columns("finger_exercises")}
    if "unit_id" not in ex_cols:
        op.add_column(
            "finger_exercises",
            sa.Column("unit_id", sa.BigInteger(), nullable=True),
        )
        op.execute(
            """
            UPDATE finger_exercises fe
            SET unit_id = fc.unit_id
            FROM finger_lessons fl
            JOIN finger_chapters fc ON fl.chapter_id = fc.id
            WHERE fe.lesson_id = fl.id
            """
        )
        op.execute(
            "DELETE FROM finger_exercises WHERE unit_id IS NULL"
        )
        op.alter_column("finger_exercises", "unit_id", nullable=False)
        op.create_foreign_key(
            "fk_finger_exercises_unit_id",
            "finger_exercises",
            "finger_units",
            ["unit_id"],
            ["id"],
        )
        op.create_index(
            "ix_finger_exercises_unit_id",
            "finger_exercises",
            ["unit_id"],
        )

    # ── 2. Migrate the exercise type enum to the new four types ────────────
    # Wipe exercises so we can safely swap the enum (they are re-seeded anyway).
    # Also clear dependent result rows that reference exercises.
    op.execute("DELETE FROM finger_user_exercise_results")
    op.execute("DELETE FROM finger_exercise_options")
    op.execute("DELETE FROM finger_exercises")

    # Change column to plain text so we can drop and recreate the enum type.
    op.execute(
        "ALTER TABLE finger_exercises "
        "ALTER COLUMN exercise_type TYPE TEXT USING exercise_type::TEXT"
    )

    # Drop old enum (PostgreSQL does not support removing values from an enum).
    op.execute("DROP TYPE IF EXISTS finger_exercise_type")

    # Create new enum with the four types used by unit exercises.
    op.execute(
        "CREATE TYPE finger_exercise_type AS ENUM "
        "('multiple_choice', 'true_false', 'multiple_answer', 'matching')"
    )

    # Convert column back.
    op.execute(
        "ALTER TABLE finger_exercises "
        "ALTER COLUMN exercise_type TYPE finger_exercise_type "
        "USING exercise_type::finger_exercise_type"
    )

    # ── 3. Create finger_exercise_attempts ─────────────────────────────────
    tables = set(inspector.get_table_names())
    if "finger_exercise_attempts" not in tables:
        op.create_table(
            "finger_exercise_attempts",
            sa.Column(
                "id",
                postgresql.UUID(as_uuid=True),
                primary_key=True,
            ),
            sa.Column(
                "user_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("users.id"),
                nullable=False,
            ),
            sa.Column(
                "unit_id",
                sa.BigInteger(),
                sa.ForeignKey("finger_units.id"),
                nullable=False,
            ),
            sa.Column("question_ids", postgresql.JSONB(), nullable=False),
            sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("max_score", sa.Integer(), nullable=False, server_default="0"),
            sa.Column(
                "is_completed",
                sa.Boolean(),
                nullable=False,
                server_default="false",
            ),
            sa.Column(
                "started_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
        )
        op.create_index(
            "ix_finger_exercise_attempts_user_id",
            "finger_exercise_attempts",
            ["user_id"],
        )
        op.create_index(
            "ix_finger_exercise_attempts_unit_id",
            "finger_exercise_attempts",
            ["unit_id"],
        )

    # ── 4. Create finger_exercise_attempt_answers ──────────────────────────
    if "finger_exercise_attempt_answers" not in tables:
        op.create_table(
            "finger_exercise_attempt_answers",
            sa.Column(
                "id",
                postgresql.UUID(as_uuid=True),
                primary_key=True,
            ),
            sa.Column(
                "attempt_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("finger_exercise_attempts.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "exercise_id",
                sa.BigInteger(),
                sa.ForeignKey("finger_exercises.id"),
                nullable=False,
            ),
            sa.Column(
                "selected_option_ids",
                postgresql.JSONB(),
                nullable=False,
                server_default="[]",
            ),
            sa.Column(
                "matching_pairs",
                postgresql.JSONB(),
                nullable=True,
            ),
            sa.Column(
                "is_correct",
                sa.Boolean(),
                nullable=False,
                server_default="false",
            ),
            sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
        )
        op.create_index(
            "ix_finger_exercise_attempt_answers_attempt_id",
            "finger_exercise_attempt_answers",
            ["attempt_id"],
        )
        op.create_index(
            "ix_finger_exercise_attempt_answers_exercise_id",
            "finger_exercise_attempt_answers",
            ["exercise_id"],
        )


def downgrade() -> None:
    op.drop_table("finger_exercise_attempt_answers")
    op.drop_table("finger_exercise_attempts")

    op.execute(
        "ALTER TABLE finger_exercises "
        "ALTER COLUMN exercise_type TYPE TEXT USING exercise_type::TEXT"
    )
    op.execute("DROP TYPE IF EXISTS finger_exercise_type")
    op.execute(
        "CREATE TYPE finger_exercise_type AS ENUM "
        "('multiple_choice', 'free_form', 'image_select', 'matching')"
    )
    op.execute(
        "ALTER TABLE finger_exercises "
        "ALTER COLUMN exercise_type TYPE finger_exercise_type "
        "USING exercise_type::finger_exercise_type"
    )

    op.drop_index("ix_finger_exercises_unit_id", table_name="finger_exercises")
    op.drop_constraint(
        "fk_finger_exercises_unit_id", "finger_exercises", type_="foreignkey"
    )
    op.drop_column("finger_exercises", "unit_id")
