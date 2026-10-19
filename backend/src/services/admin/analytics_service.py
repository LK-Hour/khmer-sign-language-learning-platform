"""Analytics service for the admin dashboard.

Computes real-time KPI metrics and chart data from the database.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import distinct, func, and_, cast, union_all, Float as SAFloat
from sqlalchemy.orm import Session

from src.models.feedback import LessonFeedback
from src.models.finger_spelling import (
    FingerLesson,
    FingerUserExerciseProgress,
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
    """Encapsulates all analytics queries for the admin dashboard.

    Every metric is scoped to learner accounts (``User.account_type ==
    "student"``) so an admin's own logins, progress, or activity never
    skews the numbers. ``lesson_feedback`` has no ``user_id`` column (it's
    anonymous), so ``_feedback_distribution`` is the one metric that can't
    be scoped this way.
    """

    #: Reused everywhere a query touches `users` directly, so "student" stays
    #: the single definition of who counts toward these metrics.
    STUDENT_FILTER = User.account_type == "student"

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

    #: Smallest previous-period value a percentage change is reported for.
    #: Below this the percentage is noise (1 -> 76 reads as "+7500%").
    MIN_BASE = 50

    #: Window for "most difficult": older practice no longer reflects difficulty.
    DIFFICULT_WINDOW_DAYS = 90

    @staticmethod
    def _pct_change(
        current: float, previous: float, min_base: float = MIN_BASE
    ) -> float | None:
        """Percentage change between two period values.

        Returns ``None`` when the previous period is too small to be a
        meaningful baseline; callers surface that as "New" instead of a
        huge or invented percentage.
        """
        if previous <= 0 or previous < min_base:
            return None
        return round(((current - previous) / previous) * 100, 1)

    @staticmethod
    def _month_windows(now: datetime) -> tuple[datetime, datetime, datetime]:
        """Return ``(current_start, previous_start, previous_end)``.

        The current window is month-to-date ``[current_start, now]``. The
        previous window covers the same number of elapsed days of last
        month, ``[previous_start, previous_end)``, so a partial month is
        never compared against a full one.
        """
        current_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        previous_start = (current_start - timedelta(days=1)).replace(day=1)
        previous_end = min(previous_start + (now - current_start), current_start)
        return current_start, previous_start, previous_end

    def _count_kpi(
        self, current: float, previous: float, total: float | None = None
    ) -> KpiValue:
        """KPI for a count: percent change (if baseline is big enough) + delta."""
        return KpiValue(
            value=float(current),
            change=self._pct_change(float(current), float(previous)),
            delta=float(current - previous),
            total=total,
        )

    @staticmethod
    def _points_kpi(
        current: float | None, previous: float | None
    ) -> KpiValue:
        """KPI for a score/percentage: change in percentage points.

        ``None`` for either side means "no data that period", so there is
        nothing to compare against.
        """
        value = round(current, 1) if current is not None else 0.0
        if current is None or previous is None:
            return KpiValue(value=value, change=None, change_unit="points")
        diff = round(current - previous, 1)
        return KpiValue(value=value, change=diff, change_unit="points", delta=diff)

    # ── KPI Methods ──────────────────────────────────────────────────────

    def _total_users(self) -> KpiValue:
        """Count users where is_guest=false AND is_active=true, with change vs end of last month."""
        now = datetime.now(timezone.utc)
        current_month_start, _, _ = self._month_windows(now)

        base_filter = and_(
            User.is_guest == False,  # noqa: E712
            User.is_active == True,  # noqa: E712
            self.STUDENT_FILTER,
        )

        current_total = (
            self.db.query(func.count(User.id)).filter(base_filter).scalar()
        ) or 0

        # Count as of end of previous month (created before current month start)
        previous_total = (
            self.db.query(func.count(User.id))
            .filter(base_filter)
            .filter(User.created_at < current_month_start)
            .scalar()
        ) or 0

        return self._count_kpi(current_total, previous_total)

    def _active_users(self) -> KpiValue:
        """Count distinct students who logged in within the last 7 days.

        Change compares the current 7-day window vs the previous 7-day
        window. Both windows use the same definition (``last_login_at``);
        refresh tokens are deliberately not used because they stay valid for
        days after the last real visit and would inflate only one side.
        """
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        fourteen_days_ago = now - timedelta(days=14)

        current_count = (
            self.db.query(func.count(distinct(User.id)))
            .filter(User.last_login_at >= seven_days_ago, self.STUDENT_FILTER)
            .scalar()
        ) or 0

        previous_count = (
            self.db.query(func.count(distinct(User.id)))
            .filter(
                User.last_login_at >= fourteen_days_ago,
                User.last_login_at < seven_days_ago,
                self.STUDENT_FILTER,
            )
            .scalar()
        ) or 0

        return self._count_kpi(current_count, previous_count)

    def _count_completed(
        self,
        model,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> int:
        """Completed progress rows of ``model`` (students only), optionally in ``[start, end)``."""
        query = (
            self.db.query(func.count(model.id))
            .join(User, User.id == model.user_id)
            .filter(model.is_completed == True, self.STUDENT_FILTER)  # noqa: E712
        )
        if start is not None:
            query = query.filter(model.completed_at >= start)
        if end is not None:
            query = query.filter(model.completed_at < end)
        return query.scalar() or 0

    def _completed_lessons(self) -> KpiValue:
        """Lessons completed this month (month-to-date) vs the same days of last month.

        ``total`` carries the all-time figure so the card can show both.
        """
        now = datetime.now(timezone.utc)
        current_start, previous_start, previous_end = self._month_windows(now)
        models = (FingerUserLessonProgress, WordDetectionUserLessonProgress)

        current_total = sum(self._count_completed(m, current_start) for m in models)
        previous_total = sum(
            self._count_completed(m, previous_start, previous_end) for m in models
        )
        all_time = sum(self._count_completed(m) for m in models)

        return self._count_kpi(current_total, previous_total, total=float(all_time))

    def _quiz_attempts(self) -> KpiValue:
        """Count of finger_user_exercise_progress rows, month-to-date vs same days of last month."""
        now = datetime.now(timezone.utc)
        current_start, previous_start, previous_end = self._month_windows(now)

        # Use completed_at; fall back to created_at
        ts = func.coalesce(
            FingerUserExerciseProgress.completed_at,
            FingerUserExerciseProgress.created_at,
        )
        current_count = (
            self.db.query(func.count(FingerUserExerciseProgress.id))
            .join(User, User.id == FingerUserExerciseProgress.user_id)
            .filter(ts >= current_start, self.STUDENT_FILTER)
            .scalar()
        ) or 0

        previous_count = (
            self.db.query(func.count(FingerUserExerciseProgress.id))
            .join(User, User.id == FingerUserExerciseProgress.user_id)
            .filter(ts >= previous_start, ts < previous_end, self.STUDENT_FILTER)
            .scalar()
        ) or 0

        return self._count_kpi(current_count, previous_count)

    def _avg_quiz_score(self) -> KpiValue:
        """AVG((score/max_score)*100) where is_completed=true and max_score > 0.

        Change is in percentage points vs the same days of last month.
        """
        now = datetime.now(timezone.utc)
        current_start, previous_start, previous_end = self._month_windows(now)

        base_filter = and_(
            FingerUserExerciseProgress.is_completed == True,  # noqa: E712
            FingerUserExerciseProgress.max_score > 0,
        )

        score_expr = (
            cast(FingerUserExerciseProgress.score, SAFloat)
            / cast(FingerUserExerciseProgress.max_score, SAFloat)
            * 100
        )
        ts = func.coalesce(
            FingerUserExerciseProgress.completed_at,
            FingerUserExerciseProgress.created_at,
        )

        current_avg = (
            self.db.query(func.avg(score_expr))
            .join(User, User.id == FingerUserExerciseProgress.user_id)
            .filter(base_filter)
            .filter(ts >= current_start, self.STUDENT_FILTER)
            .scalar()
        )

        previous_avg = (
            self.db.query(func.avg(score_expr))
            .join(User, User.id == FingerUserExerciseProgress.user_id)
            .filter(base_filter)
            .filter(ts >= previous_start, ts < previous_end, self.STUDENT_FILTER)
            .scalar()
        )

        return self._points_kpi(
            float(current_avg) if current_avg is not None else None,
            float(previous_avg) if previous_avg is not None else None,
        )

    def _ai_recognition_accuracy(self) -> KpiValue:
        """AVG(predicted_confidence * 100) where NOT NULL across both tables.

        Change is in percentage points vs the same days of last month.
        """
        now = datetime.now(timezone.utc)
        current_start, previous_start, previous_end = self._month_windows(now)

        def _window(model, start: datetime, end: datetime | None = None):
            query = (
                self.db.query(
                    func.avg(model.predicted_confidence * 100),
                    func.count(model.id),
                )
                .join(User, User.id == model.user_id)
                .filter(
                    model.predicted_confidence.isnot(None),
                    model.created_at >= start,
                    self.STUDENT_FILTER,
                )
            )
            if end is not None:
                query = query.filter(model.created_at < end)
            return query.one()

        # Weighted average across both tables; None when there is no data.
        def _weighted_avg(result1: tuple, result2: tuple) -> float | None:
            avg1, count1 = result1
            avg2, count2 = result2
            avg1 = float(avg1) if avg1 is not None else 0.0
            avg2 = float(avg2) if avg2 is not None else 0.0
            count1 = int(count1) if count1 else 0
            count2 = int(count2) if count2 else 0
            total_count = count1 + count2
            if total_count == 0:
                return None
            return (avg1 * count1 + avg2 * count2) / total_count

        current_accuracy = _weighted_avg(
            _window(FingerUserLessonProgress, current_start),
            _window(WordDetectionUserLessonProgress, current_start),
        )
        previous_accuracy = _weighted_avg(
            _window(FingerUserLessonProgress, previous_start, previous_end),
            _window(WordDetectionUserLessonProgress, previous_start, previous_end),
        )

        return self._points_kpi(current_accuracy, previous_accuracy)

    # ── Chart Methods ────────────────────────────────────────────────────

    def _monthly_active_users(self) -> MonthlyActiveUsers:
        """Monthly distinct student counts from January to the current month.

        A monthly active user is a distinct student with real activity in
        that month: a login, a lesson practiced, or a quiz completed.
        Refresh-token validity is not used; a long-lived token would make
        the user "active" in every month it overlaps.
        """
        now = datetime.now(timezone.utc)
        current_year = now.year

        month_names = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ]

        quiz_ts = func.coalesce(
            FingerUserExerciseProgress.completed_at,
            FingerUserExerciseProgress.created_at,
        )

        categories: list[str] = []
        series: list[int] = []

        for month in range(1, now.month + 1):
            month_start = datetime(current_year, month, 1, tzinfo=timezone.utc)
            if month < 12:
                month_end = datetime(current_year, month + 1, 1, tzinfo=timezone.utc)
            else:
                month_end = datetime(current_year + 1, 1, 1, tzinfo=timezone.utc)

            sources = [
                self.db.query(User.id.label("user_id")).filter(
                    User.last_login_at >= month_start,
                    User.last_login_at < month_end,
                    self.STUDENT_FILTER,
                ),
                self.db.query(FingerUserLessonProgress.user_id.label("user_id"))
                .join(User, User.id == FingerUserLessonProgress.user_id)
                .filter(
                    FingerUserLessonProgress.last_practiced_at >= month_start,
                    FingerUserLessonProgress.last_practiced_at < month_end,
                    self.STUDENT_FILTER,
                ),
                self.db.query(WordDetectionUserLessonProgress.user_id.label("user_id"))
                .join(User, User.id == WordDetectionUserLessonProgress.user_id)
                .filter(
                    WordDetectionUserLessonProgress.last_practiced_at >= month_start,
                    WordDetectionUserLessonProgress.last_practiced_at < month_end,
                    self.STUDENT_FILTER,
                ),
                self.db.query(FingerUserExerciseProgress.user_id.label("user_id"))
                .join(User, User.id == FingerUserExerciseProgress.user_id)
                .filter(
                    quiz_ts >= month_start,
                    quiz_ts < month_end,
                    self.STUDENT_FILTER,
                ),
            ]

            combined = union_all(*(q.subquery().select() for q in sources)).subquery()
            count = (
                self.db.query(func.count(distinct(combined.c.user_id))).scalar()
            ) or 0

            categories.append(month_names[month - 1])
            series.append(int(count))

        return MonthlyActiveUsers(categories=categories, series=series)

    def _track_completion(self, progress_model, lesson_id_col, lesson_model) -> tuple[int, int]:
        """Return ``(completed, possible)`` for one track.

        ``completed`` is the number of distinct (student, lesson) pairs that
        are completed. ``possible`` is lessons x students: the number of
        completions if every student finished every lesson. Dividing by
        lessons alone would exceed 100% as soon as a second student
        completes the same lesson.
        """
        completed = (
            self.db.query(progress_model.user_id, lesson_id_col)
            .join(User, User.id == progress_model.user_id)
            .filter(progress_model.is_completed == True, self.STUDENT_FILTER)  # noqa: E712
            .distinct()
            .count()
        )
        total_lessons = (
            self.db.query(func.count(lesson_model.id)).scalar()
        ) or 0
        student_count = (
            self.db.query(func.count(User.id)).filter(self.STUDENT_FILTER).scalar()
        ) or 0
        return completed, total_lessons * student_count

    @staticmethod
    def _completion_pct(completed: int, possible: int) -> float:
        """Completion percentage clamped to 0-100 (0 when nothing is possible)."""
        if possible <= 0:
            return 0.0
        return min(100.0, round((completed / possible) * 100, 1))

    def _finger_completion(self) -> tuple[int, int]:
        return self._track_completion(
            FingerUserLessonProgress,
            FingerUserLessonProgress.finger_lesson_id,
            FingerLesson,
        )

    def _word_completion(self) -> tuple[int, int]:
        return self._track_completion(
            WordDetectionUserLessonProgress,
            WordDetectionUserLessonProgress.word_detection_lesson_id,
            WordDetectionLesson,
        )

    def _learning_progress_donut(self) -> LearningProgressDonut:
        """All-time completed vs remaining percentage across both tracks.

        completed = distinct (student, lesson) completions / (lessons x students) * 100
        remaining = 100 - completed
        """
        finger_completed, finger_possible = self._finger_completion()
        word_completed, word_possible = self._word_completion()

        possible = finger_possible + word_possible
        if possible == 0:
            return LearningProgressDonut(completed=0.0, remaining=100.0)

        completed_pct = self._completion_pct(finger_completed + word_completed, possible)
        return LearningProgressDonut(
            completed=completed_pct, remaining=round(100 - completed_pct, 1)
        )

    def _track_progress(self) -> list[TrackProgress]:
        """Per-track all-time completion percentage (same definition as the donut)."""
        finger_completed, finger_possible = self._finger_completion()
        word_completed, word_possible = self._word_completion()

        return [
            TrackProgress(
                label="Finger Spelling",
                value=self._completion_pct(finger_completed, finger_possible),
            ),
            TrackProgress(
                label="Word Detection",
                value=self._completion_pct(word_completed, word_possible),
            ),
        ]

    def _most_practiced(self) -> list[LessonRankEntry]:
        """Top 5 lessons by total attempts, joined with lesson name_kh.

        Includes lessons from BOTH progress tables. Lessons are keyed by
        (track, lesson id), so a finger lesson and a word lesson that share a
        name stay separate entries.
        """
        finger_query = (
            self.db.query(
                FingerUserLessonProgress.finger_lesson_id.label("lesson_id"),
                func.sum(FingerUserLessonProgress.attempts).label("total_attempts"),
                FingerLesson.name_kh.label("name_kh"),
            )
            .join(FingerLesson, FingerLesson.id == FingerUserLessonProgress.finger_lesson_id)
            .join(User, User.id == FingerUserLessonProgress.user_id)
            .filter(self.STUDENT_FILTER)
            .group_by(FingerUserLessonProgress.finger_lesson_id, FingerLesson.name_kh)
        )

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
            .join(User, User.id == WordDetectionUserLessonProgress.user_id)
            .filter(self.STUDENT_FILTER)
            .group_by(
                WordDetectionUserLessonProgress.word_detection_lesson_id,
                WordDetectionLesson.name_kh,
            )
        )

        entries: list[tuple[str, float]] = []
        for row in finger_query.all():
            entries.append((row.name_kh, float(row.total_attempts or 0)))
        for row in word_query.all():
            entries.append((row.name_kh, float(row.total_attempts or 0)))

        entries.sort(key=lambda x: x[1], reverse=True)
        return [LessonRankEntry(label=name, value=attempts) for name, attempts in entries[:5]]

    def _most_difficult(self) -> list[LessonRankEntry]:
        """Top 5 lessons by difficulty over the last ``DIFFICULT_WINDOW_DAYS`` days.

        Difficulty score = 100 - (avg_confidence * 100), averaged over
        progress rows practiced in the window (WHERE confidence NOT NULL),
        so old data doesn't dominate. Joined with lesson name_kh.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=self.DIFFICULT_WINDOW_DAYS)

        finger_query = (
            self.db.query(
                FingerUserLessonProgress.finger_lesson_id.label("lesson_id"),
                func.avg(FingerUserLessonProgress.predicted_confidence).label("avg_confidence"),
                FingerLesson.name_kh.label("name_kh"),
            )
            .join(FingerLesson, FingerLesson.id == FingerUserLessonProgress.finger_lesson_id)
            .join(User, User.id == FingerUserLessonProgress.user_id)
            .filter(
                FingerUserLessonProgress.predicted_confidence.isnot(None),
                FingerUserLessonProgress.last_practiced_at >= cutoff,
                self.STUDENT_FILTER,
            )
            .group_by(FingerUserLessonProgress.finger_lesson_id, FingerLesson.name_kh)
        )

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
            .join(User, User.id == WordDetectionUserLessonProgress.user_id)
            .filter(
                WordDetectionUserLessonProgress.predicted_confidence.isnot(None),
                WordDetectionUserLessonProgress.last_practiced_at >= cutoff,
                self.STUDENT_FILTER,
            )
            .group_by(
                WordDetectionUserLessonProgress.word_detection_lesson_id,
                WordDetectionLesson.name_kh,
            )
        )

        all_lessons: list[tuple[str, float]] = []
        for row in [*finger_query.all(), *word_query.all()]:
            avg_conf = float(row.avg_confidence) if row.avg_confidence is not None else 0.0
            all_lessons.append((row.name_kh, round(100 - (avg_conf * 100), 1)))

        # Highest difficulty first = lowest confidence
        all_lessons.sort(key=lambda x: x[1], reverse=True)
        return [LessonRankEntry(label=name, value=score) for name, score in all_lessons[:5]]

    def _feedback_distribution(self) -> list[FeedbackDistribution]:
        """Count of lesson_feedback grouped by type column."""
        results = (
            self.db.query(
                LessonFeedback.type,
                func.count(LessonFeedback.id).label("count"),
            )
            .filter(LessonFeedback.is_active.is_(True))
            .group_by(LessonFeedback.type)
            .all()
        )

        return [
            FeedbackDistribution(label=row.type.value if hasattr(row.type, 'value') else str(row.type), value=int(row.count))
            for row in results
        ]
