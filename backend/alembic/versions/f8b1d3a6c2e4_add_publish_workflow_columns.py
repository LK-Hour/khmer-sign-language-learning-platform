"""add publish workflow columns to curriculum content tables

Existing rows are backfilled as "published" so live content stays
learner-visible; new admin-created content starts as "draft" (enforced by
the admin services, not the database default).

Revision ID: f8b1d3a6c2e4
Revises: c4f7a9d2e1b3
Create Date: 2026-07-02 15:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "f8b1d3a6c2e4"
down_revision: Union[str, None] = "c4f7a9d2e1b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PUBLISHABLE_TABLES = (
    "finger_units",
    "finger_chapters",
    "finger_lessons",
    "finger_exercises",
    "word_detection_units",
    "word_detection_chapters",
    "word_detection_lessons",
    "word_detection_exercises",
)


def upgrade() -> None:
    for table in PUBLISHABLE_TABLES:
        op.add_column(
            table,
            sa.Column(
                "publish_status",
                sa.String(length=20),
                nullable=False,
                server_default="published",
            ),
        )
        op.add_column(table, sa.Column("published_at", sa.DateTime(), nullable=True))
        op.add_column(
            table,
            sa.Column(
                "published_by",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("users.id"),
                nullable=True,
            ),
        )


def downgrade() -> None:
    for table in reversed(PUBLISHABLE_TABLES):
        op.drop_column(table, "published_by")
        op.drop_column(table, "published_at")
        op.drop_column(table, "publish_status")
