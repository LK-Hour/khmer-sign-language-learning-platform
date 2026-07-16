"""Add indexes for analytics query performance.

Revision ID: add_analytics_indexes
Revises: e5f7a9b1c3d4
Create Date: 2026-07-16
"""

from alembic import op

# revision identifiers
revision = "add_analytics_indexes"
down_revision = "e5f7a9b1c3d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # User indexes for active-user and MAU analytics
    op.create_index("ix_users_last_login_at", "users", ["last_login_at"])
    op.create_index("ix_users_is_guest_is_active", "users", ["is_guest", "is_active"])

    # RefreshToken composite index for MAU queries (revoked + expires_at)
    op.create_index(
        "ix_refresh_tokens_revoked_expires", "refresh_tokens", ["revoked", "expires_at"]
    )

    # FingerExerciseAttempt index for quiz-attempt analytics
    op.create_index(
        "ix_finger_exercise_attempts_started_at", "finger_exercise_attempts", ["started_at"]
    )

    # Progress table composite indexes for completion analytics
    op.create_index(
        "ix_finger_user_lesson_progress_completed",
        "finger_user_lesson_progress",
        ["is_completed", "completed_at"],
    )
    op.create_index(
        "ix_word_detection_user_lesson_progress_completed",
        "word_detection_user_lesson_progress",
        ["is_completed", "completed_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_word_detection_user_lesson_progress_completed", "word_detection_user_lesson_progress")
    op.drop_index("ix_finger_user_lesson_progress_completed", "finger_user_lesson_progress")
    op.drop_index("ix_finger_exercise_attempts_started_at", "finger_exercise_attempts")
    op.drop_index("ix_refresh_tokens_revoked_expires", "refresh_tokens")
    op.drop_index("ix_users_is_guest_is_active", "users")
    op.drop_index("ix_users_last_login_at", "users")
