"""add lesson feedback table

Revision ID: 3b1b0c9d5f7a
Revises: e2e96f8e8ac3
Create Date: 2026-06-23 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "3b1b0c9d5f7a"
down_revision: Union[str, None] = "e2e96f8e8ac3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # Create feedback_mood enum if not exists
    bind.execute(
        sa.text(
            "DO $$ BEGIN "
            "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_mood') THEN "
            "CREATE TYPE feedback_mood AS ENUM "
            "('very_bad', 'bad', 'okay', 'good', 'excellent'); "
            "END IF; "
            "END $$"
        )
    )

    # Create feedback_type enum if not exists
    bind.execute(
        sa.text(
            "DO $$ BEGIN "
            "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_type') THEN "
            "CREATE TYPE feedback_type AS ENUM "
            "('finger_spelling', 'words'); "
            "END IF; "
            "END $$"
        )
    )

    feedback_mood_col = postgresql.ENUM(
        "very_bad", "bad", "okay", "good", "excellent",
        name="feedback_mood", create_type=False
    )

    feedback_type_col = postgresql.ENUM(
        "finger_spelling", "words",
        name="feedback_type", create_type=False
    )

    op.create_table(
        "lesson_feedback",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("type", feedback_type_col, nullable=False),
        sa.Column("category", sa.String(255), nullable=False),
        sa.Column("lesson_id", sa.BigInteger(), sa.ForeignKey("finger_lessons.id"), nullable=False),
        sa.Column("characteristic", sa.String(255), nullable=False),
        sa.Column("mood", feedback_mood_col, nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_lesson_feedback_lesson_id", "lesson_feedback", ["lesson_id"])


def downgrade() -> None:
    op.drop_index("ix_lesson_feedback_lesson_id", table_name="lesson_feedback")
    op.drop_table("lesson_feedback")

    bind = op.get_bind()
    bind.execute(
        sa.text(
            "DO $$ BEGIN "
            "IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_mood') THEN "
            "DROP TYPE feedback_mood; "
            "END IF; "
            "END $$"
        )
    )
    bind.execute(
        sa.text(
            "DO $$ BEGIN "
            "IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_type') THEN "
            "DROP TYPE feedback_type; "
            "END IF; "
            "END $$"
        )
    )