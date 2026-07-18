"""Unit tests for the admin dashboard :class:`AnalyticsService`.

The analytics service aggregates KPI and chart data across the whole database,
so these tests use delta-based assertions (measure a metric, insert known rows,
measure again) rather than assuming the database starts empty. Rows are created
through the shared ``db`` fixture, which wraps each test in a transaction that
is rolled back afterwards.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from src.models.feedback import FeedbackMood, FeedbackType, LessonFeedback
from src.models.finger_spelling import (
    FingerChapter,
    FingerExerciseAttempt,
    FingerLesson,
    FingerUnit,
    FingerUserLessonProgress,
)
from src.models.refresh_token import RefreshToken
from src.models.user import User
from src.models.word_detection import (
    WordDetectionChapter,
    WordDetectionLesson,
    WordDetectionUnit,
    WordDetectionUserLessonProgress,
)
from src.schemas.admin.analytics import (
    DashboardAnalyticsResponse,
    KpiValue,
    LearningProgressDonut,
    MonthlyActiveUsers,
)
from src.services.admin.analytics_service import AnalyticsService
from tests.helpers import safe_order_index, unique_suffix

NOW = datetime.now(timezone.utc)
CURRENT_MONTH_START = NOW.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
PREVIOUS_MONTH_START = (CURRENT_MONTH_START - timedelta(days=1)).replace(day=1)
# A naive timestamp comfortably inside the current month (used for the naive
# DateTime columns on progress/attempt tables).
IN_CURRENT_MONTH = (CURRENT_MONTH_START + timedelta(days=1)).replace(tzinfo=None)
IN_PREVIOUS_MONTH = (PREVIOUS_MONTH_START + timedelta(days=1)).replace(tzinfo=None)


# ── Fixtures / builders ─────────────────────────────────────────────────────


def _make_user(db, *, is_guest=False, is_active=True, last_login_at=None):
    suffix = unique_suffix()
    user = User(
        username=f"analytics_{suffix}",
        email=f"analytics_{suffix}@example.com",
        display_name="Analytics User",
        account_type="student",
        auth_provider="email",
        is_guest=is_guest,
        is_active=is_active,
        last_login_at=last_login_at,
    )
    db.add(user)
    db.flush()
    return user


def _make_finger_lesson(db):
    suffix = unique_suffix()
    unit = FingerUnit(
        name_en=f"U {suffix}",
        name_kh=f"ឯកតា {suffix}",
        order_index=safe_order_index(),
    )
    db.add(unit)
    db.flush()
    chapter = FingerChapter(
        unit_id=unit.id,
        name_en=f"C {suffix}",
        name_kh=f"ជំពូក {suffix}",
        order_index=safe_order_index(),
    )
    db.add(chapter)
    db.flush()
    lesson = FingerLesson(
        chapter_id=chapter.id,
        name_en=f"L {suffix}",
        name_kh=f"មេរៀន {suffix}",
        order_index=safe_order_index(),
    )
    db.add(lesson)
    db.flush()
    return unit, lesson


def _make_word_lesson(db):
    suffix = unique_suffix()
    unit = WordDetectionUnit(
        name_en=f"WU {suffix}",
        name_kh=f"ឯកតា​ពាក្យ {suffix}",
        order_index=safe_order_index(),
    )
    db.add(unit)
    db.flush()
    chapter = WordDetectionChapter(
        unit_id=unit.id,
        name_en=f"WC {suffix}",
        name_kh=f"ជំពូក​ពាក្យ {suffix}",
        order_index=safe_order_index(),
    )
    db.add(chapter)
    db.flush()
    lesson = WordDetectionLesson(
        chapter_id=chapter.id,
        name_en=f"WL {suffix}",
        name_kh=f"មេរៀន​ពាក្យ {suffix}",
        order_index=safe_order_index(),
    )
    db.add(lesson)
    db.flush()
    return unit, lesson


# ── _pct_change (pure) ──────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "current, previous, expected",
    [
        (10.0, 5.0, 100.0),      # doubled
        (5.0, 10.0, -50.0),      # halved
        (10.0, 10.0, 0.0),       # unchanged
        (7.0, 0.0, 100.0),       # from zero, positive now
        (0.0, 0.0, 0.0),         # from zero, still zero
        (3.0, 4.0, -25.0),
    ],
)
def test_pct_change(current, previous, expected):
    assert AnalyticsService._pct_change(current, previous) == expected


def test_pct_change_rounds_to_one_decimal():
    # (1 - 3) / 3 * 100 = -66.666... -> -66.7
    assert AnalyticsService._pct_change(1.0, 3.0) == -66.7


# ── get_dashboard_data shape ────────────────────────────────────────────────


def test_get_dashboard_data_returns_full_response(db):
    result = AnalyticsService(db).get_dashboard_data()

    assert isinstance(result, DashboardAnalyticsResponse)
    assert isinstance(result.total_users, KpiValue)
    assert isinstance(result.active_users_today, KpiValue)
    assert isinstance(result.completed_lessons, KpiValue)
    assert isinstance(result.quiz_attempts, KpiValue)
    assert isinstance(result.avg_quiz_score, KpiValue)
    assert isinstance(result.ai_recognition_accuracy, KpiValue)
    assert isinstance(result.monthly_active_users, MonthlyActiveUsers)
    assert isinstance(result.learning_progress_donut, LearningProgressDonut)
    assert isinstance(result.track_progress, list)
    assert isinstance(result.most_practiced, list)
    assert isinstance(result.most_difficult, list)
    assert isinstance(result.feedback_distribution, list)


# ── _total_users ────────────────────────────────────────────────────────────


def test_total_users_counts_active_non_guest(db):
    service = AnalyticsService(db)
    before = service._total_users().value

    _make_user(db)
    _make_user(db)

    after = service._total_users().value
    assert after == before + 2


def test_total_users_excludes_guests_and_inactive(db):
    service = AnalyticsService(db)
    before = service._total_users().value

    _make_user(db, is_guest=True)
    _make_user(db, is_active=False)

    after = service._total_users().value
    assert after == before


# ── _active_users ───────────────────────────────────────────────────────────


def test_active_users_counts_recent_login(db):
    service = AnalyticsService(db)
    before = service._active_users().value

    _make_user(db, last_login_at=NOW - timedelta(days=1))

    after = service._active_users().value
    assert after == before + 1


def test_active_users_counts_valid_refresh_token(db):
    service = AnalyticsService(db)
    before = service._active_users().value

    user = _make_user(db)
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=uuid.uuid4().hex,
            expires_at=NOW + timedelta(days=5),
            revoked=False,
        )
    )
    db.flush()

    after = service._active_users().value
    assert after == before + 1


def test_active_users_ignores_expired_and_revoked_tokens(db):
    service = AnalyticsService(db)
    before = service._active_users().value

    user = _make_user(db)  # no recent login
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=uuid.uuid4().hex,
            expires_at=NOW - timedelta(days=1),  # expired
            revoked=False,
        )
    )
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=uuid.uuid4().hex,
            expires_at=NOW + timedelta(days=5),
            revoked=True,  # revoked
        )
    )
    db.flush()

    after = service._active_users().value
    assert after == before


# ── _completed_lessons ──────────────────────────────────────────────────────


def test_completed_lessons_counts_both_tracks(db):
    service = AnalyticsService(db)
    before = service._completed_lessons().value

    user = _make_user(db)
    _, finger_lesson = _make_finger_lesson(db)
    _, word_lesson = _make_word_lesson(db)

    db.add(
        FingerUserLessonProgress(
            user_id=user.id,
            finger_lesson_id=finger_lesson.id,
            is_completed=True,
            completed_at=IN_CURRENT_MONTH,
        )
    )
    db.add(
        WordDetectionUserLessonProgress(
            user_id=user.id,
            word_detection_lesson_id=word_lesson.id,
            is_completed=True,
            completed_at=IN_CURRENT_MONTH,
        )
    )
    db.flush()

    after = service._completed_lessons().value
    assert after == before + 2


def test_completed_lessons_ignores_incomplete(db):
    service = AnalyticsService(db)
    before = service._completed_lessons().value

    user = _make_user(db)
    _, finger_lesson = _make_finger_lesson(db)
    db.add(
        FingerUserLessonProgress(
            user_id=user.id,
            finger_lesson_id=finger_lesson.id,
            is_completed=False,
            completed_at=IN_CURRENT_MONTH,
        )
    )
    db.flush()

    after = service._completed_lessons().value
    assert after == before


# ── _quiz_attempts ──────────────────────────────────────────────────────────


def test_quiz_attempts_counts_current_month(db):
    service = AnalyticsService(db)
    before = service._quiz_attempts().value

    user = _make_user(db)
    unit, _ = _make_finger_lesson(db)
    db.add(
        FingerExerciseAttempt(
            user_id=user.id,
            unit_id=unit.id,
            question_ids=[1, 2, 3],
            score=0,
            max_score=0,
            started_at=IN_CURRENT_MONTH,
        )
    )
    # An attempt in the previous month should not count toward current value.
    db.add(
        FingerExerciseAttempt(
            user_id=user.id,
            unit_id=unit.id,
            question_ids=[1],
            score=0,
            max_score=0,
            started_at=IN_PREVIOUS_MONTH,
        )
    )
    db.flush()

    after = service._quiz_attempts().value
    assert after == before + 1


# ── _avg_quiz_score & _ai_recognition_accuracy ──────────────────────────────


def test_avg_quiz_score_reflects_completed_attempts(db):
    service = AnalyticsService(db)

    # Only meaningful when nothing else contributes this month.
    if service._quiz_attempts().value != 0:
        pytest.skip("Pre-existing quiz attempts make the average non-deterministic")

    user = _make_user(db)
    unit, _ = _make_finger_lesson(db)
    for score, max_score in ((8, 10), (6, 10)):  # 80% and 60% -> avg 70%
        db.add(
            FingerExerciseAttempt(
                user_id=user.id,
                unit_id=unit.id,
                question_ids=[1],
                score=score,
                max_score=max_score,
                is_completed=True,
                started_at=IN_CURRENT_MONTH,
            )
        )
    db.flush()

    assert service._avg_quiz_score().value == pytest.approx(70.0)


def test_ai_recognition_accuracy_weighted_average(db):
    service = AnalyticsService(db)
    before = service._ai_recognition_accuracy()

    # Only assert an exact value when the DB has no other confidence rows.
    if before.value != 0.0:
        pytest.skip("Pre-existing confidence rows make the average non-deterministic")

    user = _make_user(db)
    _, finger_lesson = _make_finger_lesson(db)
    _, word_lesson = _make_word_lesson(db)
    db.add(
        FingerUserLessonProgress(
            user_id=user.id,
            finger_lesson_id=finger_lesson.id,
            predicted_confidence=0.9,
            created_at=IN_CURRENT_MONTH,
        )
    )
    db.add(
        WordDetectionUserLessonProgress(
            user_id=user.id,
            word_detection_lesson_id=word_lesson.id,
            predicted_confidence=0.7,
            created_at=IN_CURRENT_MONTH,
        )
    )
    db.flush()

    # Weighted average of 90% and 70% over equal counts -> 80%.
    assert service._ai_recognition_accuracy().value == pytest.approx(80.0)


# ── _monthly_active_users ───────────────────────────────────────────────────


def test_monthly_active_users_shape(db):
    result = AnalyticsService(db)._monthly_active_users()

    assert isinstance(result, MonthlyActiveUsers)
    assert len(result.categories) == NOW.month
    assert len(result.series) == NOW.month
    assert result.categories[0] == "Jan"
    assert all(isinstance(v, int) and v >= 0 for v in result.series)


def test_monthly_active_users_counts_recent_login_in_current_month(db):
    service = AnalyticsService(db)
    before = service._monthly_active_users().series[NOW.month - 1]

    _make_user(db, last_login_at=NOW - timedelta(hours=1))

    after = service._monthly_active_users().series[NOW.month - 1]
    assert after == before + 1


# ── _learning_progress_donut & _track_progress ──────────────────────────────


def test_learning_progress_donut_percentages_sum_to_100(db):
    donut = AnalyticsService(db)._learning_progress_donut()
    assert donut.completed + donut.remaining == pytest.approx(100.0)
    assert 0.0 <= donut.completed <= 100.0


def test_track_progress_returns_both_tracks(db):
    tracks = AnalyticsService(db)._track_progress()
    labels = {t.label for t in tracks}
    assert labels == {"Finger Spelling", "Word Detection"}
    assert all(0.0 <= t.value <= 100.0 for t in tracks)


# ── _most_practiced & _most_difficult ───────────────────────────────────────


def test_most_practiced_ranks_by_attempts(db):
    user = _make_user(db)
    _, lesson = _make_finger_lesson(db)
    db.add(
        FingerUserLessonProgress(
            user_id=user.id,
            finger_lesson_id=lesson.id,
            attempts=999_999,
        )
    )
    db.flush()

    ranked = AnalyticsService(db)._most_practiced()
    assert len(ranked) <= 5
    assert ranked[0].label == lesson.name_kh
    assert ranked[0].value == pytest.approx(999_999.0)


def test_most_difficult_uses_difficulty_score(db):
    user = _make_user(db)
    _, lesson = _make_finger_lesson(db)
    db.add(
        FingerUserLessonProgress(
            user_id=user.id,
            finger_lesson_id=lesson.id,
            predicted_confidence=0.1,  # low confidence -> high difficulty (90)
        )
    )
    db.flush()

    ranked = AnalyticsService(db)._most_difficult()
    assert len(ranked) <= 5
    assert ranked[0].label == lesson.name_kh
    assert ranked[0].value == pytest.approx(90.0)


# ── _feedback_distribution ──────────────────────────────────────────────────


def test_feedback_distribution_groups_by_type(db):
    service = AnalyticsService(db)

    def _count_for(distribution, label):
        for entry in distribution:
            if entry.label == label:
                return entry.value
        return 0

    before = _count_for(service._feedback_distribution(), FeedbackType.FINGER_SPELLING.value)

    _, lesson = _make_finger_lesson(db)
    db.add(
        LessonFeedback(
            type=FeedbackType.FINGER_SPELLING,
            category="clarity",
            lesson_id=lesson.id,
            characteristic="video",
            mood=FeedbackMood.GOOD,
        )
    )
    db.flush()

    after = _count_for(service._feedback_distribution(), FeedbackType.FINGER_SPELLING.value)
    assert after == before + 1
