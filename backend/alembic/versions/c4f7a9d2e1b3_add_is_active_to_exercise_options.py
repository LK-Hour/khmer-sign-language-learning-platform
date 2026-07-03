"""add is_active to exercise option tables

Revision ID: c4f7a9d2e1b3
Revises: b2c4d6e8f0a1
Create Date: 2026-07-02 13:40:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c4f7a9d2e1b3"
down_revision: Union[str, None] = "b2c4d6e8f0a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "finger_exercise_options",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column(
        "word_detection_exercise_options",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )


def downgrade() -> None:
    op.drop_column("word_detection_exercise_options", "is_active")
    op.drop_column("finger_exercise_options", "is_active")
