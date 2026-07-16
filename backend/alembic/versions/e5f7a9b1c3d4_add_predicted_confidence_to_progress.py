"""add predicted_confidence to progress tables

Add a nullable Float column `predicted_confidence` to both
`finger_user_lesson_progress` and `word_detection_user_lesson_progress`
tables to store AI recognition confidence scores.

Revision ID: e5f7a9b1c3d4
Revises: d3e5f7a9b1c4
Create Date: 2025-07-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e5f7a9b1c3d4"
down_revision: Union[str, Sequence[str], None] = "d3e5f7a9b1c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "finger_user_lesson_progress",
        sa.Column("predicted_confidence", sa.Float(), nullable=True),
    )
    op.add_column(
        "word_detection_user_lesson_progress",
        sa.Column("predicted_confidence", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("word_detection_user_lesson_progress", "predicted_confidence")
    op.drop_column("finger_user_lesson_progress", "predicted_confidence")
