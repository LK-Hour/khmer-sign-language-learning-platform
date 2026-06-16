"""merge numbered and oauth migration branches

Revision ID: e2e96f8e8ac3
Revises: 7f3a2c9d1b4e
Create Date: 2026-06-15 15:59:59.889289

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "e2e96f8e8ac3"
down_revision: Union[str, None] = "7f3a2c9d1b4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Single head after 7f3a2c9d1b4e (refresh_tokens).

    Idempotently ensures refresh_tokens exists for databases that were stamped at
    7f3a2c9d1b4e without running that revision (legacy local 001-006 workflows).
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "refresh_tokens" in inspector.get_table_names():
        return

    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("lifetime_days", sa.Integer(), server_default="7", nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("last_ip", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=False)
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "refresh_tokens" not in inspector.get_table_names():
        return

    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_token_hash", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
