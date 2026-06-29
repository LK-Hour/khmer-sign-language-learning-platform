"""add_server_default_last_practiced_at

Revision ID: b786217c19e9
Revises: d6ca71e6d712
Create Date: 2026-06-28 21:02:41.741561

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = 'b786217c19e9'
down_revision: Union[str, None] = 'd6ca71e6d712'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Intentionally no-op: last_practiced_at must only be set by practice attempts,
    # not by row creation.
    pass


def downgrade() -> None:
    pass
