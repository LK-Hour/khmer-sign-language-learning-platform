"""Fix is_locked default to true and update existing records

Revision ID: fix_is_locked_001
Revises: dfc09d8a49b6
Create Date: 2026-05-30 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_is_locked_001'
down_revision: Union[str, None] = 'dfc09d8a49b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update all existing finger_user_lesson_progress records where is_locked=false to true
    op.execute(
        "UPDATE finger_user_lesson_progress SET is_locked = true WHERE is_locked = false"
    )
    
    # Update the server default for is_locked column to 'true'
    op.alter_column(
        'finger_user_lesson_progress',
        'is_locked',
        existing_type=sa.Boolean(),
        server_default='true',
        existing_server_default='false',
        nullable=False
    )


def downgrade() -> None:
    # Revert the server default back to 'false'
    op.alter_column(
        'finger_user_lesson_progress',
        'is_locked',
        existing_type=sa.Boolean(),
        server_default='false',
        existing_server_default='true',
        nullable=False
    )
    
    # Revert records back to false (optional - not recommended in production)
    # op.execute(
    #     "UPDATE finger_user_lesson_progress SET is_locked = false"
    # )
