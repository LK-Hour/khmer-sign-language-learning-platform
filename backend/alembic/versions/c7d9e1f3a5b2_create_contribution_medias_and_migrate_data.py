"""create contribution_medias table and migrate data

Phase 1 migration:
- Creates the contribution_medias table
- Adds contribution_media_id FK column to word_detection_contributions
- Migrates existing media records referenced by contributions into the new table
- Updates FK references on word_detection_contributions

Revision ID: c7d9e1f3a5b2
Revises: b4c6d8e0f2a3, a4b6c8d2e0f1
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c7d9e1f3a5b2"
down_revision: Union[str, Sequence[str], None] = ("b4c6d8e0f2a3", "a4b6c8d2e0f1")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    # ── 1. Create contribution_medias table (idempotent) ────────────────────
    if "contribution_medias" not in existing_tables:
        op.execute(
            """
            CREATE TABLE contribution_medias (
                id BIGSERIAL PRIMARY KEY,
                media_type media_type NOT NULL,
                file_url VARCHAR(500) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now()
            )
            """
        )

    # ── 2. Add contribution_media_id column to word_detection_contributions ─
    wdc_cols = {c["name"] for c in inspector.get_columns("word_detection_contributions")}
    if "contribution_media_id" not in wdc_cols:
        op.add_column(
            "word_detection_contributions",
            sa.Column("contribution_media_id", sa.BigInteger(), nullable=True),
        )
        op.create_foreign_key(
            "fk_word_detection_contributions_contribution_media_id",
            "word_detection_contributions",
            "contribution_medias",
            ["contribution_media_id"],
            ["id"],
        )
        op.create_index(
            "ix_word_detection_contributions_contribution_media_id",
            "word_detection_contributions",
            ["contribution_media_id"],
            unique=False,
        )

    # ── 3. Migrate data: copy distinct referenced media into contribution_medias
    # Only migrate if media_id column still exists (i.e. Phase 2 not run yet)
    wdc_cols_now = {c["name"] for c in inspector.get_columns("word_detection_contributions")}
    if "media_id" in wdc_cols_now:
        op.execute(
            """
            INSERT INTO contribution_medias (id, media_type, file_url, created_at, updated_at)
            SELECT DISTINCT m.id, m.media_type, m.file_url, m.created_at, m.updated_at
            FROM medias m
            INNER JOIN word_detection_contributions wdc ON wdc.media_id = m.id
            WHERE wdc.media_id IS NOT NULL
            ON CONFLICT (id) DO NOTHING
            """
        )

        # ── 4. Update word_detection_contributions to reference new records ──────
        op.execute(
            """
            UPDATE word_detection_contributions
            SET contribution_media_id = media_id
            WHERE media_id IS NOT NULL
            """
        )


def downgrade() -> None:
    # ── 1. Clear contribution_media_id references ────────────────────────────
    op.execute(
        """
        UPDATE word_detection_contributions
        SET contribution_media_id = NULL
        WHERE contribution_media_id IS NOT NULL
        """
    )

    # ── 2. Drop index, FK constraint, and column ─────────────────────────────
    op.drop_index(
        "ix_word_detection_contributions_contribution_media_id",
        table_name="word_detection_contributions",
    )
    op.drop_constraint(
        "fk_word_detection_contributions_contribution_media_id",
        "word_detection_contributions",
        type_="foreignkey",
    )
    op.drop_column("word_detection_contributions", "contribution_media_id")

    # ── 3. Drop contribution_medias table ────────────────────────────────────
    op.drop_table("contribution_medias")
