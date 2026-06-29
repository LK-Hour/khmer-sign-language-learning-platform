"""add word detection tables

Revision ID: a1c3e5f7b9d2
Revises: b786217c19e9
Create Date: 2026-06-29 11:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1c3e5f7b9d2'
down_revision: Union[str, None] = 'b786217c19e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── word_detection_units ──────────────────────────────────────────────
    op.create_table(
        'word_detection_units',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name_en', sa.String(length=255), nullable=False),
        sa.Column('name_kh', sa.String(length=255), nullable=False),
        sa.Column('description_en', sa.Text(), nullable=True),
        sa.Column('description_kh', sa.Text(), nullable=True),
        sa.Column('order_index', sa.BigInteger(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name_kh', name='uq_word_detection_units_name_kh'),
        sa.UniqueConstraint('order_index', name='uq_word_detection_units_order_index'),
    )
    op.create_index(
        'ix_word_detection_units_order_index', 'word_detection_units', ['order_index'], unique=False
    )

    # ── word_detection_chapters (includes level) ──────────────────────────
    op.create_table(
        'word_detection_chapters',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('unit_id', sa.BigInteger(), nullable=False),
        sa.Column('name_en', sa.String(length=255), nullable=False),
        sa.Column('name_kh', sa.String(length=255), nullable=False),
        sa.Column('description_en', sa.Text(), nullable=True),
        sa.Column('description_kh', sa.Text(), nullable=True),
        sa.Column('order_index', sa.BigInteger(), nullable=False),
        sa.Column('level', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['unit_id'], ['word_detection_units.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'unit_id', 'order_index', name='uq_word_detection_chapters_unit_id_order_index'
        ),
    )
    op.create_index(
        'ix_word_detection_chapters_unit_id', 'word_detection_chapters', ['unit_id'], unique=False
    )
    op.create_index(
        'ix_word_detection_chapters_order_index',
        'word_detection_chapters',
        ['order_index'],
        unique=False,
    )

    # ── word_detection_lessons ────────────────────────────────────────────
    op.create_table(
        'word_detection_lessons',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('chapter_id', sa.BigInteger(), nullable=False),
        sa.Column('name_en', sa.String(length=255), nullable=False),
        sa.Column('name_kh', sa.String(length=255), nullable=False),
        sa.Column('description_en', sa.Text(), nullable=True),
        sa.Column('description_kh', sa.Text(), nullable=True),
        sa.Column('order_index', sa.BigInteger(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['chapter_id'], ['word_detection_chapters.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'chapter_id', 'order_index', name='uq_word_detection_lessons_chapter_id_order_index'
        ),
    )
    op.create_index(
        'ix_word_detection_lessons_chapter_id',
        'word_detection_lessons',
        ['chapter_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_lessons_order_index',
        'word_detection_lessons',
        ['order_index'],
        unique=False,
    )

    # ── word_detection_words ──────────────────────────────────────────────
    op.create_table(
        'word_detection_words',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('word_en', sa.String(length=100), nullable=True),
        sa.Column('word_kh', sa.String(length=100), nullable=False),
        sa.Column('description_en', sa.Text(), nullable=True),
        sa.Column('description_kh', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('word_kh', name='uq_word_detection_words_word_kh'),
    )

    # ── word_detection_lesson_words (junction) ────────────────────────────
    op.create_table(
        'word_detection_lesson_words',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('lesson_id', sa.BigInteger(), nullable=False),
        sa.Column('word_id', sa.BigInteger(), nullable=False),
        sa.Column('order_index', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['word_detection_lessons.id']),
        sa.ForeignKeyConstraint(['word_id'], ['word_detection_words.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'lesson_id', 'word_id', name='uq_word_detection_lesson_words_lesson_word'
        ),
        sa.UniqueConstraint(
            'lesson_id', 'order_index', name='uq_word_detection_lesson_words_lesson_order'
        ),
    )
    op.create_index(
        'ix_word_detection_lesson_words_lesson_id',
        'word_detection_lesson_words',
        ['lesson_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_lesson_words_word_id',
        'word_detection_lesson_words',
        ['word_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_lesson_words_order_index',
        'word_detection_lesson_words',
        ['order_index'],
        unique=False,
    )

    # ── word_detection_word_medias ────────────────────────────────────────
    op.create_table(
        'word_detection_word_medias',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('word_id', sa.BigInteger(), nullable=False),
        sa.Column('media_id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['media_id'], ['medias.id']),
        sa.ForeignKeyConstraint(['word_id'], ['word_detection_words.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_word_detection_word_medias_word_id',
        'word_detection_word_medias',
        ['word_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_word_medias_media_id',
        'word_detection_word_medias',
        ['media_id'],
        unique=False,
    )

    # ── word_detection_exercises ──────────────────────────────────────────
    op.create_table(
        'word_detection_exercises',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('lesson_id', sa.BigInteger(), nullable=False),
        sa.Column('question_en', sa.Text(), nullable=False),
        sa.Column('question_kh', sa.Text(), nullable=False),
        sa.Column(
            'exercise_type',
            sa.Enum(
                'multiple_choice',
                'free_form',
                'image_select',
                'matching',
                name='word_detection_exercise_type',
            ),
            nullable=False,
        ),
        sa.Column('media_id', sa.BigInteger(), nullable=True),
        sa.Column('correct_answer', sa.Text(), nullable=True),
        sa.Column('explanation_en', sa.Text(), nullable=True),
        sa.Column('explanation_kh', sa.Text(), nullable=True),
        sa.Column('order_index', sa.BigInteger(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['word_detection_lessons.id']),
        sa.ForeignKeyConstraint(['media_id'], ['medias.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'lesson_id', 'order_index', name='uq_word_detection_exercises_lesson_order'
        ),
    )
    op.create_index(
        'ix_word_detection_exercises_lesson_id',
        'word_detection_exercises',
        ['lesson_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_exercises_media_id',
        'word_detection_exercises',
        ['media_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_exercises_order_index',
        'word_detection_exercises',
        ['order_index'],
        unique=False,
    )

    # ── word_detection_exercise_options ───────────────────────────────────
    op.create_table(
        'word_detection_exercise_options',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('exercise_id', sa.BigInteger(), nullable=False),
        sa.Column('option_text_en', sa.String(length=500), nullable=True),
        sa.Column('option_text_kh', sa.String(length=500), nullable=True),
        sa.Column('media_id', sa.BigInteger(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('points', sa.BigInteger(), nullable=False),
        sa.Column('order_index', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exercise_id'], ['word_detection_exercises.id']),
        sa.ForeignKeyConstraint(['media_id'], ['medias.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'exercise_id', 'order_index', name='uq_word_detection_exercise_options_exercise_order'
        ),
    )
    op.create_index(
        'ix_word_detection_exercise_options_exercise_id',
        'word_detection_exercise_options',
        ['exercise_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_exercise_options_media_id',
        'word_detection_exercise_options',
        ['media_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_exercise_options_order_index',
        'word_detection_exercise_options',
        ['order_index'],
        unique=False,
    )

    # ── word_detection_user_lesson_progress ───────────────────────────────
    op.create_table(
        'word_detection_user_lesson_progress',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('word_detection_lesson_id', sa.BigInteger(), nullable=False),
        sa.Column('is_completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_locked', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('attempts', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column(
            'last_practiced_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True
        ),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(
            ['word_detection_lesson_id'], ['word_detection_lessons.id']
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'user_id',
            'word_detection_lesson_id',
            name='uq_word_detection_user_lesson_progress_user_lesson',
        ),
    )
    op.create_index(
        'ix_word_detection_user_lesson_progress_user_id',
        'word_detection_user_lesson_progress',
        ['user_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_user_lesson_progress_lesson_id',
        'word_detection_user_lesson_progress',
        ['word_detection_lesson_id'],
        unique=False,
    )

    # ── word_detection_user_exercise_results ──────────────────────────────
    op.create_table(
        'word_detection_user_exercise_results',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('progress_id', sa.UUID(), nullable=False),
        sa.Column('word_detection_exercise_id', sa.BigInteger(), nullable=False),
        sa.Column('selected_option_id', sa.BigInteger(), nullable=True),
        sa.Column('selected_answer', sa.Text(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('time_taken', sa.BigInteger(), nullable=False),
        sa.Column('attempt_number', sa.BigInteger(), nullable=False),
        sa.Column('score', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('answered_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(
            ['progress_id'], ['word_detection_user_lesson_progress.id']
        ),
        sa.ForeignKeyConstraint(
            ['selected_option_id'], ['word_detection_exercise_options.id']
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(
            ['word_detection_exercise_id'], ['word_detection_exercises.id']
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_word_detection_user_exercise_results_user_id',
        'word_detection_user_exercise_results',
        ['user_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_user_exercise_results_progress_id',
        'word_detection_user_exercise_results',
        ['progress_id'],
        unique=False,
    )
    op.create_index(
        'ix_word_detection_user_exercise_results_exercise_id',
        'word_detection_user_exercise_results',
        ['word_detection_exercise_id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        'ix_word_detection_user_exercise_results_exercise_id',
        table_name='word_detection_user_exercise_results',
    )
    op.drop_index(
        'ix_word_detection_user_exercise_results_progress_id',
        table_name='word_detection_user_exercise_results',
    )
    op.drop_index(
        'ix_word_detection_user_exercise_results_user_id',
        table_name='word_detection_user_exercise_results',
    )
    op.drop_table('word_detection_user_exercise_results')

    op.drop_index(
        'ix_word_detection_user_lesson_progress_lesson_id',
        table_name='word_detection_user_lesson_progress',
    )
    op.drop_index(
        'ix_word_detection_user_lesson_progress_user_id',
        table_name='word_detection_user_lesson_progress',
    )
    op.drop_table('word_detection_user_lesson_progress')

    op.drop_index(
        'ix_word_detection_exercise_options_order_index',
        table_name='word_detection_exercise_options',
    )
    op.drop_index(
        'ix_word_detection_exercise_options_media_id',
        table_name='word_detection_exercise_options',
    )
    op.drop_index(
        'ix_word_detection_exercise_options_exercise_id',
        table_name='word_detection_exercise_options',
    )
    op.drop_table('word_detection_exercise_options')

    op.drop_index(
        'ix_word_detection_exercises_order_index', table_name='word_detection_exercises'
    )
    op.drop_index(
        'ix_word_detection_exercises_media_id', table_name='word_detection_exercises'
    )
    op.drop_index(
        'ix_word_detection_exercises_lesson_id', table_name='word_detection_exercises'
    )
    op.drop_table('word_detection_exercises')
    op.drop_enum('word_detection_exercise_type')

    op.drop_index(
        'ix_word_detection_word_medias_media_id', table_name='word_detection_word_medias'
    )
    op.drop_index(
        'ix_word_detection_word_medias_word_id', table_name='word_detection_word_medias'
    )
    op.drop_table('word_detection_word_medias')

    op.drop_index(
        'ix_word_detection_lesson_words_order_index',
        table_name='word_detection_lesson_words',
    )
    op.drop_index(
        'ix_word_detection_lesson_words_word_id', table_name='word_detection_lesson_words'
    )
    op.drop_index(
        'ix_word_detection_lesson_words_lesson_id', table_name='word_detection_lesson_words'
    )
    op.drop_table('word_detection_lesson_words')

    op.drop_table('word_detection_words')

    op.drop_index(
        'ix_word_detection_lessons_order_index', table_name='word_detection_lessons'
    )
    op.drop_index(
        'ix_word_detection_lessons_chapter_id', table_name='word_detection_lessons'
    )
    op.drop_table('word_detection_lessons')

    op.drop_index(
        'ix_word_detection_chapters_order_index', table_name='word_detection_chapters'
    )
    op.drop_index(
        'ix_word_detection_chapters_unit_id', table_name='word_detection_chapters'
    )
    op.drop_table('word_detection_chapters')

    op.drop_index(
        'ix_word_detection_units_order_index', table_name='word_detection_units'
    )
    op.drop_table('word_detection_units')
