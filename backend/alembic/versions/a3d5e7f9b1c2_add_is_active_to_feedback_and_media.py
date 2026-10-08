"""add is_active soft-delete flag to lesson_feedback and medias

Admin DELETE on feedback and media now deactivates the row instead of
removing it. Existing rows are backfilled as active.

Revision ID: a3d5e7f9b1c2
Revises: 7c76dbdfc0d8
Create Date: 2026-10-08 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a3d5e7f9b1c2"
down_revision: Union[str, None] = "7c76dbdfc0d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SOFT_DELETE_TABLES = ("lesson_feedback", "medias")


def upgrade() -> None:
    for table in SOFT_DELETE_TABLES:
        op.add_column(
            table,
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        )


def downgrade() -> None:
    for table in SOFT_DELETE_TABLES:
        op.drop_column(table, "is_active")
