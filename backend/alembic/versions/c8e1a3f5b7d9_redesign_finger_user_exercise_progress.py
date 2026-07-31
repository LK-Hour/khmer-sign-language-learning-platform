"""Redesign finger user exercise progress; drop attempt tables.

- Drop finger_exercise_attempt_answers and finger_exercise_attempts
- Replace finger_exercise_progress with lean finger_user_exercise_progress
  (one row per finished unit quiz attempt)

Revision ID: c8e1a3f5b7d9
Revises: 00a89508d405
Create Date: 2026-07-17 10:52:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c8e1a3f5b7d9"
down_revision: Union[str, None] = "00a89508d405"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "finger_exercise_attempt_answers" in tables:
        op.drop_table("finger_exercise_attempt_answers")

    if "finger_exercise_attempts" in tables:
        # Indexes may already exist from analytics migration; drop_table removes them.
        op.drop_table("finger_exercise_attempts")

    if "finger_exercise_progress" in tables:
        op.drop_table("finger_exercise_progress")

    if "finger_user_exercise_progress" not in set(sa.inspect(bind).get_table_names()):
        op.create_table(
            "finger_user_exercise_progress",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
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
            sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("max_score", sa.Integer(), nullable=False, server_default="0"),
            sa.Column(
                "is_completed",
                sa.Boolean(),
                nullable=False,
                server_default="true",
            ),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
            ),
        )
        op.create_index(
            "ix_finger_user_exercise_progress_user_id",
            "finger_user_exercise_progress",
            ["user_id"],
        )
        op.create_index(
            "ix_finger_user_exercise_progress_unit_id",
            "finger_user_exercise_progress",
            ["unit_id"],
        )
        op.create_index(
            "ix_finger_user_exercise_progress_user_unit",
            "finger_user_exercise_progress",
            ["user_id", "unit_id"],
        )
        op.create_index(
            "ix_finger_user_exercise_progress_user_unit_completed",
            "finger_user_exercise_progress",
            ["user_id", "unit_id", "is_completed"],
        )
        op.create_index(
            "ix_finger_user_exercise_progress_completed_at",
            "finger_user_exercise_progress",
            ["completed_at"],
        )


def downgrade() -> None:
    op.drop_table("finger_user_exercise_progress")

    op.create_table(
        "finger_exercise_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "finger_exercise_id",
            sa.BigInteger(),
            sa.ForeignKey("finger_exercises.id"),
            nullable=False,
        ),
        sa.Column(
            "selected_answer_id",
            sa.BigInteger(),
            sa.ForeignKey("finger_exercise_options.id"),
            nullable=True,
        ),
        sa.Column("selected_answer", sa.Text(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), server_default="false"),
        sa.Column("attempts", sa.BigInteger(), server_default="0"),
        sa.Column("score", sa.BigInteger(), server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index(
        "ix_finger_exercise_progress_user_id",
        "finger_exercise_progress",
        ["user_id"],
    )
    op.create_index(
        "ix_finger_exercise_progress_exercise_id",
        "finger_exercise_progress",
        ["finger_exercise_id"],
    )

    op.create_table(
        "finger_exercise_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
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
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="false"),
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
    op.create_index(
        "ix_finger_exercise_attempts_started_at",
        "finger_exercise_attempts",
        ["started_at"],
    )

    op.create_table(
        "finger_exercise_attempt_answers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
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
        sa.Column("matching_pairs", postgresql.JSONB(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=False, server_default="false"),
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
