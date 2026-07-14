"""cleanup contribution media legacy refs

Phase 2 migration (cleanup):
- Drops the legacy media_id column (and its FK constraint + index) from
  word_detection_contributions
- Deletes records from medias that are no longer referenced by any
  curriculum table (i.e. only contribution records referenced them)

Revision ID: d3e5f7a9b1c4
Revises: c7d9e1f3a5b2
Create Date: 2026-07-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d3e5f7a9b1c4"
down_revision: Union[str, Sequence[str], None] = "c7d9e1f3a5b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Drop index on media_id ────────────────────────────────────────────
    op.drop_index(
        "ix_word_detection_contributions_media_id",
        table_name="word_detection_contributions",
    )

    # ── 2. Drop FK constraint on media_id ────────────────────────────────────
    # The constraint was auto-named by PostgreSQL when the table was created
    # without an explicit constraint name.
    op.drop_constraint(
        "word_detection_contributions_media_id_fkey",
        "word_detection_contributions",
        type_="foreignkey",
    )

    # ── 3. Drop legacy media_id column ───────────────────────────────────────
    op.drop_column("word_detection_contributions", "media_id")

    # ── 4. Delete orphaned media records not referenced by any curriculum table
    #
    # A media record is considered "orphaned" (safe to delete) when its id is
    # NOT present in any of the eight curriculum FK columns.  We use a single
    # NOT EXISTS + UNION subquery so the deletion is atomic and readable.
    op.execute(
        """
        DELETE FROM medias
        WHERE NOT EXISTS (
            SELECT 1 FROM finger_letter_medias        WHERE finger_letter_medias.media_id        = medias.id
            UNION ALL
            SELECT 1 FROM finger_exercises            WHERE finger_exercises.media_id            = medias.id
            UNION ALL
            SELECT 1 FROM finger_exercise_options     WHERE finger_exercise_options.media_id     = medias.id
            UNION ALL
            SELECT 1 FROM finger_practice_medias      WHERE finger_practice_medias.media_id      = medias.id
            UNION ALL
            SELECT 1 FROM word_detection_word_medias  WHERE word_detection_word_medias.media_id  = medias.id
            UNION ALL
            SELECT 1 FROM word_detection_exercises    WHERE word_detection_exercises.media_id    = medias.id
            UNION ALL
            SELECT 1 FROM word_detection_exercise_options WHERE word_detection_exercise_options.media_id = medias.id
            UNION ALL
            SELECT 1 FROM word_detection_practice_medias  WHERE word_detection_practice_medias.media_id  = medias.id
        )
        """
    )


def downgrade() -> None:
    # ── 1. Re-add media_id column as nullable BigInteger ─────────────────────
    op.add_column(
        "word_detection_contributions",
        sa.Column("media_id", sa.BigInteger(), nullable=True),
    )

    # ── 2. Re-add FK constraint ───────────────────────────────────────────────
    op.create_foreign_key(
        "word_detection_contributions_media_id_fkey",
        "word_detection_contributions",
        "medias",
        ["media_id"],
        ["id"],
    )

    # ── 3. Re-add index ───────────────────────────────────────────────────────
    op.create_index(
        "ix_word_detection_contributions_media_id",
        "word_detection_contributions",
        ["media_id"],
        unique=False,
    )
