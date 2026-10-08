"""Restore correct_answer on exercise tables

``b4c6d8e0f2a3_refactor_exercise_tables`` dropped ``correct_answer`` from both
exercise tables as part of a broader cleanup, but the column is still a live
dependency: ``word_detection_exercise_service._grade_exercise`` reads
``exercise.correct_answer`` to grade ``free_form`` word-detection exercises,
and the admin exercise schema (``ExerciseCreate``/``ExerciseUpdate``) still
accepts it. Its removal broke admin exercise creation outright (the ORM
constructor rejects the unknown kwarg) and left free-form grading reading an
attribute that no longer exists. This restores the column on both tracks;
finger-spelling exercises don't have a free-form type, so it stays unused
there, but the schema is shared across both tracks.

Revision ID: d4e6f8a0b2c3
Revises: a3d5e7f9b1c2
Create Date: 2026-10-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d4e6f8a0b2c3"
down_revision: Union[str, None] = "a3d5e7f9b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(table: str) -> set[str]:
    insp = sa.inspect(op.get_bind())
    return {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    for table in ("finger_exercises", "word_detection_exercises"):
        if "correct_answer" not in _columns(table):
            op.add_column(table, sa.Column("correct_answer", sa.Text(), nullable=True))


def downgrade() -> None:
    for table in ("finger_exercises", "word_detection_exercises"):
        if "correct_answer" in _columns(table):
            op.drop_column(table, "correct_answer")
