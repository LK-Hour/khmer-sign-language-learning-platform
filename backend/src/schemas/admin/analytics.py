"""Admin analytics response schemas.

These schemas define the response models for the analytics dashboard endpoints:
overview stats, track completion rates, leaderboard, lesson difficulty metrics,
and the unified dashboard analytics response.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


# --- Legacy individual endpoint schemas ---


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


# --- Unified Dashboard Analytics schemas ---


class KpiValue(BaseModel):
    """Single KPI metric with period-over-period change."""

    value: float
    change: float  # percentage change vs previous period


class LessonRankEntry(BaseModel):
    """Entry in a ranked lesson list (most practiced / most difficult)."""

    label: str  # lesson name_en
    value: float  # attempt count or difficulty score


class FeedbackDistribution(BaseModel):
    """Feedback count for one type."""

    label: str
    value: int


class MonthlyActiveUsers(BaseModel):
    """Monthly active users chart data."""

    categories: list[str]  # ["Jan", "Feb", ...]
    series: list[int]  # [120, 180, ...]


class LearningProgressDonut(BaseModel):
    """Donut chart: completed vs remaining."""

    completed: float  # percentage
    remaining: float  # percentage


class TrackProgress(BaseModel):
    """Per-track completion percentage."""

    label: str  # "Finger Spelling" | "Word Detection"
    value: float  # completion percentage


class DashboardAnalyticsResponse(BaseModel):
    """Unified analytics response for the admin dashboard."""

    # KPI cards
    total_users: KpiValue
    active_users_today: KpiValue
    completed_lessons: KpiValue
    quiz_attempts: KpiValue
    avg_quiz_score: KpiValue
    ai_recognition_accuracy: KpiValue

    # Charts
    monthly_active_users: MonthlyActiveUsers
    learning_progress_donut: LearningProgressDonut
    track_progress: list[TrackProgress]
    most_practiced: list[LessonRankEntry]
    most_difficult: list[LessonRankEntry]
    feedback_distribution: list[FeedbackDistribution]
