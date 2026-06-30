"""add word_detection_contributions table

Revision ID: b2c4d6e8f0a1
Revises: a1c3e5f7b9d2
Create Date: 2026-06-30 10:18:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b2c4d6e8f0a1'
down_revision: Union[str, None] = 'a1c3e5f7b9d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── word_detection_contributions ────────────────────────────────────────
    op.create_table(
        'word_detection_contributions',
        sa.Column('id', postgresql.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(), nullable=False),
        sa.Column('word_id', sa.BigInteger(), nullable=False),
        sa.Column('word_detection_lesson_id', sa.BigInteger(), nullable=True),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('media_id', sa.BigInteger(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_by', postgresql.UUID(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('consent_version', sa.String(length=50), nullable=False),
        sa.Column('consent_given', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['media_id'], ['medias.id']),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['word_detection_lesson_id'], ['word_detection_lessons.id']),
        sa.ForeignKeyConstraint(['word_id'], ['word_detection_words.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_word_detection_contributions_word_id',
        'word_detection_contributions',
        ['word_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_contributions_lesson_id',
        'word_detection_contributions',
        ['word_detection_lesson_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_contributions_media_id',
        'word_detection_contributions',
        ['media_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_contributions_status',
        'word_detection_contributions',
        ['status'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        'ix_word_detection_contributions_status',
        table_name='word_detection_contributions',
    )
    op.drop_index(
        'ix_word_detection_contributions_media_id',
        table_name='word_detection_contributions',
    )
    op.drop_index(
        'ix_word_detection_contributions_lesson_id',
        table_name='word_detection_contributions',
    )
    op.drop_index(
        'ix_word_detection_contributions_word_id',
        table_name='word_detection_contributions',
    )
    op.drop_table('word_detection_contributions')