"""Admin analytics response schemas.

These schemas define the response models for the analytics dashboard endpoints:
overview stats, track completion rates, leaderboard, and lesson difficulty metrics.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class OverviewStats(BaseModel):
    """Platform-wide summary statistics."""

    total_users: int
    total_lessons_completed: int
    active_learners_today: int


class TrackCompletionStats(BaseModel):
    """Per-track completion rate with raw counts."""

    track: str  # "finger" | "word_detection"
    completed_lessons: int
    total_lessons: int
    completion_rate: float  # percentage (0-100)


class LeaderboardEntry(BaseModel):
    """Single entry in the top learners leaderboard."""

    rank: int
    user_id: UUID
    display_name: str
    avatar_url: str | None = None
    total_completed: int
    last_active_at: datetime | None = None


class LessonDifficultyEntry(BaseModel):
    """Per-lesson difficulty metrics."""

    lesson_id: int
    lesson_name: str
    avg_attempts: float
    completion_rate: float  # percentage (0-100)
    unique_users: int
