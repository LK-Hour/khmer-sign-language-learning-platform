"""allow guest word detection contributions

Revision ID: 1a2b3c4d5e6f
Revises: f8b1d3a6c2e4
Create Date: 2026-07-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "1a2b3c4d5e6f"
down_revision: Union[str, None] = "f8b1d3a6c2e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "word_detection_contributions",
        sa.Column("guest_id", sa.String(length=100), nullable=True),
    )
    op.alter_column(
        "word_detection_contributions",
        "user_id",
        existing_type=postgresql.UUID(),
        nullable=True,
    )
    op.create_index(
        "ix_word_detection_contributions_guest_id",
        "word_detection_contributions",
        ["guest_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_word_detection_contributions_guest_id",
        table_name="word_detection_contributions",
    )
    op.alter_column(
        "word_detection_contributions",
        "user_id",
        existing_type=postgresql.UUID(),
        nullable=False,
    )
    op.drop_column("word_detection_contributions", "guest_id")
