"""Add chapter practice tables

Revision ID: a3b5c7d9e1f2
Revises: 1a2b3c4d5e6f
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a3b5c7d9e1f2"
down_revision: Union[str, None] = "1a2b3c4d5e6f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. finger_practices (depends on finger_chapters)
    op.create_table(
        "finger_practices",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("chapter_id", sa.BigInteger(), sa.ForeignKey("finger_chapters.id"), nullable=False),
        sa.Column("lesson_count", sa.BigInteger(), nullable=False, server_default="5"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint("chapter_id", name="uq_finger_practices_chapter_id"),
    )
    op.create_index("ix_finger_practices_chapter_id", "finger_practices", ["chapter_id"])

    # 2. word_detection_practices (depends on word_detection_chapters)
    op.create_table(
        "word_detection_practices",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("chapter_id", sa.BigInteger(), sa.ForeignKey("word_detection_chapters.id"), nullable=False),
        sa.Column("lesson_count", sa.BigInteger(), nullable=False, server_default="5"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint("chapter_id", name="uq_word_detection_practices_chapter_id"),
    )
    op.create_index("ix_word_detection_practices_chapter_id", "word_detection_practices", ["chapter_id"])

    # 3. finger_user_practice_progress (depends on finger_practices, users)
    op.create_table(
        "finger_user_practice_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("finger_practice_id", sa.BigInteger(), sa.ForeignKey("finger_practices.id"), nullable=False),
        sa.Column("is_complete", sa.Boolean(), server_default="false"),
        sa.Column("is_locked", sa.Boolean(), server_default="true"),
        sa.Column("attempts", sa.BigInteger(), server_default="0"),
        sa.Column("avg_score", sa.Float(), server_default="0"),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "finger_practice_id", name="uq_finger_user_practice_progress_user_practice"),
    )
    op.create_index("ix_finger_user_practice_progress_user_id", "finger_user_practice_progress", ["user_id"])
    op.create_index("ix_finger_user_practice_progress_practice_id", "finger_user_practice_progress", ["finger_practice_id"])

    # 4. word_detection_user_practice_progress (depends on word_detection_practices, users)
    op.create_table(
        "word_detection_user_practice_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("word_detection_practice_id", sa.BigInteger(), sa.ForeignKey("word_detection_practices.id"), nullable=False),
        sa.Column("is_complete", sa.Boolean(), server_default="false"),
        sa.Column("is_locked", sa.Boolean(), server_default="true"),
        sa.Column("attempts", sa.BigInteger(), server_default="0"),
        sa.Column("avg_score", sa.Float(), server_default="0"),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "word_detection_practice_id", name="uq_word_detection_user_practice_progress_user_practice"),
    )
    op.create_index("ix_word_detection_user_practice_progress_user_id", "word_detection_user_practice_progress", ["user_id"])
    op.create_index("ix_word_detection_user_practice_progress_practice_id", "word_detection_user_practice_progress", ["word_detection_practice_id"])

    # 5. finger_practice_medias (depends on finger_practices, medias)
    op.create_table(
        "finger_practice_medias",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("practice_id", sa.BigInteger(), sa.ForeignKey("finger_practices.id"), nullable=False),
        sa.Column("media_id", sa.BigInteger(), sa.ForeignKey("medias.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_finger_practice_medias_practice_id", "finger_practice_medias", ["practice_id"])
    op.create_index("ix_finger_practice_medias_media_id", "finger_practice_medias", ["media_id"])

    # 6. word_detection_practice_medias (depends on word_detection_practices, medias)
    op.create_table(
        "word_detection_practice_medias",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("practice_id", sa.BigInteger(), sa.ForeignKey("word_detection_practices.id"), nullable=False),
        sa.Column("media_id", sa.BigInteger(), sa.ForeignKey("medias.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_word_detection_practice_medias_practice_id", "word_detection_practice_medias", ["practice_id"])
    op.create_index("ix_word_detection_practice_medias_media_id", "word_detection_practice_medias", ["media_id"])


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_table("word_detection_practice_medias")
    op.drop_table("finger_practice_medias")
    op.drop_table("word_detection_user_practice_progress")
    op.drop_table("finger_user_practice_progress")
    op.drop_table("word_detection_practices")
    op.drop_table("finger_practices")
