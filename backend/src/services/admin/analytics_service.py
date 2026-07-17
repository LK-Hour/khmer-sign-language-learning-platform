"""Analytics service for the admin dashboard.

Computes real-time KPI metrics and chart data from the database.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import distinct, func, and_, cast, union_all, Float as SAFloat
from sqlalchemy.orm import Session

from src.models.feedback import LessonFeedback
from src.models.finger_spelling import (
    FingerExerciseAttempt,
    FingerLesson,
    FingerUserLessonProgress,
)
from src.models.refresh_token import RefreshToken
from src.models.user import User
from src.models.word_detection import (
    WordDetectionLesson,
    WordDetectionUserLessonProgress,
)
from src.schemas.admin.analytics import (
    DashboardAnalyticsResponse,
    FeedbackDistribution,
    KpiValue,
    LearningProgressDonut,
    LessonRankEntry,
    MonthlyActiveUsers,
    TrackProgress,
)


class AnalyticsService:
    """Encapsulates all analytics queries for the admin dashboard."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_dashboard_data(self) -> DashboardAnalyticsResponse:
        """Compute all analytics metrics from current DB state."""
        return DashboardAnalyticsResponse(
            total_users=self._total_users(),
            active_users_today=self._active_users(),
            completed_lessons=self._completed_lessons(),
            quiz_attempts=self._quiz_attempts(),
            avg_quiz_score=self._avg_quiz_score(),
            ai_recognition_accuracy=self._ai_recognition_accuracy(),
            monthly_active_users=self._monthly_active_users(),
            learning_progress_donut=self._learning_progress_donut(),
            track_progress=self._track_progress(),
            most_practiced=self._most_practiced(),
            most_difficult=self._most_difficult(),
            feedback_distribution=self._feedback_distribution(),
        )

    # ── Helpers ──────────────────────────────────────────────────────────

    @staticmethod
    def _pct_change(current: float, previous: float) -> float:
        """Compute percentage change between two period values."""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)

    # ── KPI Methods ──────────────────────────────────────────────────────

    def _total_users(self) -> KpiValue:
        """Count users where is_guest=false AND is_active=true, with month-over-month change."""
        now = datetime.now(timezone.utc)
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)

        base_filter = and_(
            User.is_guest == False,  # noqa: E712
            User.is_active == True,  # noqa: E712
        )

        # Total count (all time up to now)
        current_total = (
            self.db.query(func.count(User.id))
            .filter(base_filter)
            .filter(User.created_at < current_month_start + timedelta(days=32))
            .scalar()
        ) or 0

        # Count as of end of previous month (created before current month start)
        previous_total = (
            self.db.query(func.count(User.id))
            .filter(base_filter)
            .filter(User.created_at < current_month_start)
            .scalar()
        ) or 0

        return KpiValue(
            value=float(current_total),
            change=self._pct_change(float(current_total), float(previous_total)),
        )

    def _active_users(self) -> KpiValue:
        """Count distinct users who have a valid refresh token OR logged in within the last 7 days.

        Change compares current 7-day window vs the previous 7-day window.
        """
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        fourteen_days_ago = now - timedelta(days=14)

        # Current window: users with a valid token OR last_login_at within 7 days
        token_users_current = (
            self.db.query(RefreshToken.user_id)
            .filter(
                RefreshToken.revoked == False,  # noqa: E712
                RefreshToken.expires_at > now,
            )
        )
        login_users_current = (
            self.db.query(User.id.label("user_id"))
            .filter(User.last_login_at >= seven_days_ago)
        )
        combined_current = union_all(
            token_users_current.subquery().select(),
            login_users_current.subquery().select(),
        ).subquery()
        current_count = (
            self.db.query(func.count(distinct(combined_current.c.user_id)))
            .scalar()
        ) or 0

        # Previous window: users who logged in 14-7 days ago
        # (tokens from that window are likely revoked/rotated, so rely on last_login_at)
        previous_count = (
            self.db.query(func.count(distinct(User.id)))
            .filter(
                User.last_login_at >= fourteen_days_ago,
                User.last_login_at < seven_days_ago,
            )
            .scalar()
        ) or 0

        return KpiValue(
            value=float(current_count),
            change=self._pct_change(float(current_count), float(previous_count)),
        )

    def _completed_lessons(self) -> KpiValue:
        """Sum of is_completed=true rows from both progress tables, with month-over-month change."""
        now = datetime.now(timezone.utc)
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)

        # Current month completions (finger)
        finger_current = (
            self.db.query(func.count(FingerUserLessonProgress.id))
            .filter(
                FingerUserLessonProgress.is_completed == True,  # noqa: E712
                FingerUserLessonProgress.completed_at >= current_month_start,
            )
            .scalar()
        ) or 0

        # Current month completions (word detection)
        word_current = (
            self.db.query(func.count(WordDetectionUserLessonProgress.id))
            .filter(
                WordDetectionUserLessonProgress.is_completed == True,  # noqa: E712
                WordDetectionUserLessonProgress.completed_at >= current_month_start,
            )
            .scalar()
        ) or 0

        # Previous month completions (finger)
        finger_previous = (
            self.db.query(func.count(FingerUserLessonProgress.id))
            .filter(
                FingerUserLessonProgress.is_completed == True,  # noqa: E712
                FingerUserLessonProgress.completed_at >= previous_month_start,
                FingerUserLessonProgress.completed_at < current_month_start,
            )
            .scalar()
        ) or 0

        # Previous month completions (word detection)
        word_previous = (
            self.db.query(func.count(WordDetectionUserLessonProgress.id))
            .filter(
                WordDetectionUserLessonProgress.is_completed == True,  # noqa: E712
                WordDetectionUserLessonProgress.completed_at >= previous_month_start,
                WordDetectionUserLessonProgress.completed_at < current_month_start,
            )
            .scalar()
        ) or 0

        current_total = float(finger_current + word_current)
        previous_total = float(finger_previous + word_previous)

        return KpiValue(
            value=current_total,
            change=self._pct_change(current_total, previous_total),
        )

    def _quiz_attempts(self) -> KpiValue:
        """Count of finger_exercise_attempts rows, with month-over-month change."""
        now = datetime.now(timezone.utc)
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)

        # Current month attempts
        current_count = (
            self.db.query(func.count(FingerExerciseAttempt.id))
            .filter(FingerExerciseAttempt.started_at >= current_month_start)
            .scalar()
        ) or 0

        # Previous month attempts
        previous_count = (
            self.db.query(func.count(FingerExerciseAttempt.id))
            .filter(
                FingerExerciseAttempt.started_at >= previous_month_start,
                FingerExerciseAttempt.started_at < current_month_start,
            )
            .scalar()
        ) or 0

        return KpiValue(
            value=float(current_count),
            change=self._pct_change(float(current_count), float(previous_count)),
        )

    def _avg_quiz_score(self) -> KpiValue:
        """AVG((score/max_score)*100) where is_completed=true and max_score > 0, with month-over-month change."""
        now = datetime.now(timezone.utc)
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)

        base_filter = and_(
            FingerExerciseAttempt.is_completed == True,  # noqa: E712
            FingerExerciseAttempt.max_score > 0,
        )

        score_expr = (
            cast(FingerExerciseAttempt.score, SAFloat)
            / cast(FingerExerciseAttempt.max_score, SAFloat)
            * 100
        )

        # Current month average
        current_avg = (
            self.db.query(func.avg(score_expr))
            .filter(base_filter)
            .filter(FingerExerciseAttempt.started_at >= current_month_start)
            .scalar()
        )
        current_avg = float(current_avg) if current_avg is not None else 0.0

        # Previous month average
        previous_avg = (
            self.db.query(func.avg(score_expr))
            .filter(base_filter)
            .filter(
                FingerExerciseAttempt.started_at >= previous_month_start,
                FingerExerciseAttempt.started_at < current_month_start,
            )
            .scalar()
        )
        previous_avg = float(previous_avg) if previous_avg is not None else 0.0

        return KpiValue(
            value=round(current_avg, 1),
            change=self._pct_change(current_avg, previous_avg),
        )

    def _ai_recognition_accuracy(self) -> KpiValue:
        """AVG(predicted_confidence * 100) where NOT NULL across both tables, with month-over-month change."""
        now = datetime.now(timezone.utc)
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)

        # Finger spelling - current month
        finger_current = self.db.query(
            func.avg(FingerUserLessonProgress.predicted_confidence * 100),
            func.count(FingerUserLessonProgress.id),
        ).filter(
            FingerUserLessonProgress.predicted_confidence.isnot(None),
            FingerUserLessonProgress.created_at >= current_month_start,
        ).one()

        # Word detection - current month
        word_current = self.db.query(
            func.avg(WordDetectionUserLessonProgress.predicted_confidence * 100),
            func.count(WordDetectionUserLessonProgress.id),
        ).filter(
            WordDetectionUserLessonProgress.predicted_confidence.isnot(None),
            WordDetectionUserLessonProgress.created_at >= current_month_start,
        ).one()

        # Finger spelling - previous month
        finger_previous = self.db.query(
            func.avg(FingerUserLessonProgress.predicted_confidence * 100),
            func.count(FingerUserLessonProgress.id),
        ).filter(
            FingerUserLessonProgress.predicted_confidence.isnot(None),
            FingerUserLessonProgress.created_at >= previous_month_start,
            FingerUserLessonProgress.created_at < current_month_start,
        ).one()

        # Word detection - previous month
        word_previous = self.db.query(
            func.avg(WordDetectionUserLessonProgress.predicted_confidence * 100),
            func.count(WordDetectionUserLessonProgress.id),
        ).filter(
            WordDetectionUserLessonProgress.predicted_confidence.isnot(None),
            WordDetectionUserLessonProgress.created_at >= previous_month_start,
            WordDetectionUserLessonProgress.created_at < current_month_start,
        ).one()

        # Compute weighted average across both tables
        def _weighted_avg(result1: tuple, result2: tuple) -> float:
            avg1, count1 = result1
            avg2, count2 = result2
            avg1 = float(avg1) if avg1 is not None else 0.0
            avg2 = float(avg2) if avg2 is not None else 0.0
            count1 = int(count1) if count1 else 0
            count2 = int(count2) if count2 else 0
            total_count = count1 + count2
            if total_count == 0:
                return 0.0
            return (avg1 * count1 + avg2 * count2) / total_count

        current_accuracy = _weighted_avg(finger_current, word_current)
        previous_accuracy = _weighted_avg(finger_previous, word_previous)

        return KpiValue(
            value=round(current_accuracy, 1),
            change=self._pct_change(current_accuracy, previous_accuracy),
        )

    # ── Chart Methods ────────────────────────────────────────────────────

    def _monthly_active_users(self) -> MonthlyActiveUsers:
        """Monthly distinct user counts from January to the current month.

        A monthly active user is a distinct user who had a valid RefreshToken
        during that month OR whose last_login_at falls within that month.
        """
        now = datetime.now(timezone.utc)
        current_year = now.year
        current_month = now.month

        month_names = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ]

        categories: list[str] = []
        series: list[int] = []

        for month in range(1, current_month + 1):
            month_start = datetime(current_year, month, 1)
            if month < 12:
                month_end = datetime(current_year, month + 1, 1)
            else:
                month_end = datetime(current_year + 1, 1, 1)

            # Users with a refresh token that was valid during this month:
            # token created before month_end AND expires_at > month_start AND not revoked
            token_users = (
                self.db.query(RefreshToken.user_id)
                .filter(
                    RefreshToken.created_at < month_end,
                    RefreshToken.expires_at > month_start,
                    RefreshToken.revoked == False,  # noqa: E712
                )
            )

            # Users whose last_login_at falls within this month
            login_users = (
                self.db.query(User.id.label("user_id"))
                .filter(
                    User.last_login_at >= month_start,
                    User.last_login_at < month_end,
                )
            )

            # Union both sets and count distinct
            combined = union_all(
                token_users.subquery().select(),
                login_users.subquery().select(),
            ).subquery()

            count = (
                self.db.query(func.count(distinct(combined.c.user_id)))
                .scalar()
            ) or 0

            categories.append(month_names[month - 1])
            series.append(int(count))

        return MonthlyActiveUsers(categories=categories, series=series)

    def _learning_progress_donut(self) -> LearningProgressDonut:
        """Completed vs remaining percentage across both tracks.

        completed = (count of is_completed=true progress rows) / (total lessons) * 100
        remaining = 100 - completed
        The denominator is total lessons from both lesson tables, not progress rows.
        """
        finger_completed = (
            self.db.query(func.count(FingerUserLessonProgress.id))
            .filter(FingerUserLessonProgress.is_completed == True)  # noqa: E712
            .scalar()
        ) or 0

        finger_total_lessons = (
            self.db.query(func.count(FingerLesson.id))
            .scalar()
        ) or 0

        word_completed = (
            self.db.query(func.count(WordDetectionUserLessonProgress.id))
            .filter(WordDetectionUserLessonProgress.is_completed == True)  # noqa: E712
            .scalar()
        ) or 0

        word_total_lessons = (
            self.db.query(func.count(WordDetectionLesson.id))
            .scalar()
        ) or 0

        total_completed = finger_completed + word_completed
        total_lessons = finger_total_lessons + word_total_lessons

        if total_lessons == 0:
            return LearningProgressDonut(completed=0.0, remaining=100.0)

        completed_pct = round((total_completed / total_lessons) * 100, 1)
        remaining_pct = round(100 - completed_pct, 1)

        return LearningProgressDonut(completed=completed_pct, remaining=remaining_pct)

    def _track_progress(self) -> list[TrackProgress]:
        """Per-track completion percentage.

        Denominator is total lessons in the lesson table for each track,
        not total progress rows.
        """
        # Finger Spelling track
        finger_completed = (
            self.db.query(func.count(FingerUserLessonProgress.id))
            .filter(FingerUserLessonProgress.is_completed == True)  # noqa: E712
            .scalar()
        ) or 0

        finger_total_lessons = (
            self.db.query(func.count(FingerLesson.id))
            .scalar()
        ) or 0

        finger_pct = round((finger_completed / finger_total_lessons) * 100, 1) if finger_total_lessons > 0 else 0.0

        # Word Detection track
        word_completed = (
            self.db.query(func.count(WordDetectionUserLessonProgress.id))
            .filter(WordDetectionUserLessonProgress.is_completed == True)  # noqa: E712
            .scalar()
        ) or 0

        word_total_lessons = (
            self.db.query(func.count(WordDetectionLesson.id))
            .scalar()
        ) or 0

        word_pct = round((word_completed / word_total_lessons) * 100, 1) if word_total_lessons > 0 else 0.0

        return [
            TrackProgress(label="Finger Spelling", value=finger_pct),
            TrackProgress(label="Word Detection", value=word_pct),
        ]

    def _most_practiced(self) -> list[LessonRankEntry]:
        """Top 5 lessons by total attempts, joined with lesson name_kh.

        Includes lessons from BOTH progress tables.
        """
        # Finger lessons: group by lesson_id, sum attempts
        finger_query = (
            self.db.query(
                FingerUserLessonProgress.finger_lesson_id.label("lesson_id"),
                func.sum(FingerUserLessonProgress.attempts).label("total_attempts"),
                FingerLesson.name_kh.label("name_kh"),
            )
            .join(FingerLesson, FingerLesson.id == FingerUserLessonProgress.finger_lesson_id)
            .group_by(FingerUserLessonProgress.finger_lesson_id, FingerLesson.name_kh)
        )

        # Word detection lessons: group by lesson_id, sum attempts
        word_query = (
            self.db.query(
                WordDetectionUserLessonProgress.word_detection_lesson_id.label("lesson_id"),
                func.sum(WordDetectionUserLessonProgress.attempts).label("total_attempts"),
                WordDetectionLesson.name_kh.label("name_kh"),
            )
            .join(
                WordDetectionLesson,
                WordDetectionLesson.id == WordDetectionUserLessonProgress.word_detection_lesson_id,
            )
            .group_by(
                WordDetectionUserLessonProgress.word_detection_lesson_id,
                WordDetectionLesson.name_kh,
            )
        )

        # Combine results from both queries
        finger_results = finger_query.all()
        word_results = word_query.all()

        # Merge by name_kh (since lessons from different tables can't share IDs,
        # we treat them as separate entries)
        all_lessons: dict[str, float] = {}
        for row in finger_results:
            name = row.name_kh
            attempts = float(row.total_attempts or 0)
            all_lessons[name] = all_lessons.get(name, 0) + attempts

        for row in word_results:
            name = row.name_kh
            attempts = float(row.total_attempts or 0)
            all_lessons[name] = all_lessons.get(name, 0) + attempts

        # Sort by total attempts descending, take top 5
        sorted_lessons = sorted(all_lessons.items(), key=lambda x: x[1], reverse=True)[:5]

        return [
            LessonRankEntry(label=name, value=attempts)
            for name, attempts in sorted_lessons
        ]

    def _most_difficult(self) -> list[LessonRankEntry]:
        """Bottom 5 lessons by avg predicted_confidence (WHERE NOT NULL).

        Difficulty score = 100 - (avg_confidence * 100).
        Joined with lesson name_kh.
        """
        # Finger lessons
        finger_query = (
            self.db.query(
                FingerUserLessonProgress.finger_lesson_id.label("lesson_id"),
                func.avg(FingerUserLessonProgress.predicted_confidence).label("avg_confidence"),
                FingerLesson.name_kh.label("name_kh"),
            )
            .join(FingerLesson, FingerLesson.id == FingerUserLessonProgress.finger_lesson_id)
            .filter(FingerUserLessonProgress.predicted_confidence.isnot(None))
            .group_by(FingerUserLessonProgress.finger_lesson_id, FingerLesson.name_kh)
        )

        # Word detection lessons
        word_query = (
            self.db.query(
                WordDetectionUserLessonProgress.word_detection_lesson_id.label("lesson_id"),
                func.avg(WordDetectionUserLessonProgress.predicted_confidence).label("avg_confidence"),
                WordDetectionLesson.name_kh.label("name_kh"),
            )
            .join(
                WordDetectionLesson,
                WordDetectionLesson.id == WordDetectionUserLessonProgress.word_detection_lesson_id,
            )
            .filter(WordDetectionUserLessonProgress.predicted_confidence.isnot(None))
            .group_by(
                WordDetectionUserLessonProgress.word_detection_lesson_id,
                WordDetectionLesson.name_kh,
            )
        )

        finger_results = finger_query.all()
        word_results = word_query.all()

        # Collect all lessons with their avg confidence
        all_lessons: list[tuple[str, float]] = []
        for row in finger_results:
            avg_conf = float(row.avg_confidence) if row.avg_confidence is not None else 0.0
            difficulty_score = round(100 - (avg_conf * 100), 1)
            all_lessons.append((row.name_kh, difficulty_score))

        for row in word_results:
            avg_conf = float(row.avg_confidence) if row.avg_confidence is not None else 0.0
            difficulty_score = round(100 - (avg_conf * 100), 1)
            all_lessons.append((row.name_kh, difficulty_score))

        # Sort by difficulty score descending (highest difficulty first = lowest confidence)
        sorted_lessons = sorted(all_lessons, key=lambda x: x[1], reverse=True)[:5]

        return [
            LessonRankEntry(label=name, value=score)
            for name, score in sorted_lessons
        ]

    def _feedback_distribution(self) -> list[FeedbackDistribution]:
        """Count of lesson_feedback grouped by type column."""
        results = (
            self.db.query(
                LessonFeedback.type,
                func.count(LessonFeedback.id).label("count"),
            )
            .group_by(LessonFeedback.type)
            .all()
        )

        return [
            FeedbackDistribution(label=row.type.value if hasattr(row.type, 'value') else str(row.type), value=int(row.count))
            for row in results
        ]
