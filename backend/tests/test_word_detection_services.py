"""Unit tests for word-detection locking and progress services.

These exercise the linear-unlock logic and per-user progress bookkeeping using
the shared ``db`` fixture. The locking service keeps class-level caches, so the
``_clear_locking_cache`` fixture resets them around every test.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta

import pytest

from sqlalchemy import func, select

from src.models.word_detection import (
    WordDetectionChapter,
    WordDetectionLesson,
    WordDetectionUnit,
    WordDetectionUserLessonProgress,
)
from src.services.word_detection.word_detection_locking_service import (
    WordDetectionLockingService,
)
from src.services.word_detection.word_detection_progress_service import (
    WordDetectionProgressService,
)
from tests.helpers import safe_order_index, unique_suffix


@pytest.fixture(autouse=True)
def _clear_locking_cache():
    WordDetectionLockingService.clear_cache()
    yield
    WordDetectionLockingService.clear_cache()


def _make_user(db):
    from src.models.user import User

    suffix = unique_suffix()
    user = User(
        username=f"wd_{suffix}",
        email=f"wd_{suffix}@example.com",
        display_name="WD User",
        account_type="student",
        auth_provider="email",
    )
    db.add(user)
    db.flush()
    return user


def _next_unit_order_index(db) -> int:
    """Return an order_index strictly greater than every existing unit's."""
    current_max = db.scalar(select(func.max(WordDetectionUnit.order_index))) or 0
    return int(current_max) + 1


def _make_preceding_unit(db):
    """Create a unit + chapter + lesson that sort before any later unit,
    guaranteeing later units never contain the global-first lesson."""
    suffix = unique_suffix()
    unit = WordDetectionUnit(
        name_en=f"pre {suffix}",
        name_kh=f"មុន {suffix}",
        order_index=_next_unit_order_index(db),
    )
    db.add(unit)
    db.flush()
    chapter = WordDetectionChapter(
        unit_id=unit.id,
        name_en=f"preC {suffix}",
        name_kh=f"ជំពូកមុន {suffix}",
        order_index=safe_order_index(),
    )
    db.add(chapter)
    db.flush()
    db.add(
        WordDetectionLesson(
            chapter_id=chapter.id,
            name_en=f"preL {suffix}",
            name_kh=f"មេរៀនមុន {suffix}",
            order_index=safe_order_index(),
        )
    )
    db.flush()
    return unit


def _make_unit_with_lessons(db, lesson_count=2):
    """Create a unit -> chapter -> N lessons with ascending order_index."""
    suffix = unique_suffix()
    unit = WordDetectionUnit(
        name_en=f"U {suffix}",
        name_kh=f"ឯកតា {suffix}",
        order_index=_next_unit_order_index(db),
    )
    db.add(unit)
    db.flush()
    chapter = WordDetectionChapter(
        unit_id=unit.id,
        name_en=f"C {suffix}",
        name_kh=f"ជំពូក {suffix}",
        order_index=safe_order_index(),
    )
    db.add(chapter)
    db.flush()

    lessons = []
    base_order = safe_order_index()
    for i in range(lesson_count):
        lesson = WordDetectionLesson(
            chapter_id=chapter.id,
            name_en=f"L{i} {suffix}",
            name_kh=f"មេរៀន{i} {suffix}",
            order_index=base_order + i,
        )
        db.add(lesson)
        db.flush()
        lessons.append(lesson)
    return unit, chapter, lessons


# ── Cache helpers (pure) ─────────────────────────────────────────────────────


def test_is_cache_expired():
    fresh = datetime.now()
    stale = datetime.now() - timedelta(
        seconds=WordDetectionLockingService.CACHE_TTL_SECONDS + 10
    )
    assert WordDetectionLockingService._is_cache_expired(fresh) is False
    assert WordDetectionLockingService._is_cache_expired(stale) is True


def test_clear_cache_empties_all_caches(db):
    service = WordDetectionLockingService(db)
    service._set_cached(service._lesson_cache, (None, 1), True)
    service._set_cached(service._chapter_cache, (None, 1), True)
    service._set_cached(service._unit_cache, (None, 1), True)

    WordDetectionLockingService.clear_cache()

    assert WordDetectionLockingService._lesson_cache == {}
    assert WordDetectionLockingService._chapter_cache == {}
    assert WordDetectionLockingService._unit_cache == {}


def test_get_cached_evicts_expired_entry(db):
    service = WordDetectionLockingService(db)
    key = (None, 42)
    stale_ts = datetime.now() - timedelta(
        seconds=WordDetectionLockingService.CACHE_TTL_SECONDS + 5
    )
    service._lesson_cache[key] = (True, stale_ts)

    assert service._get_cached(service._lesson_cache, key) is None
    assert key not in service._lesson_cache  # evicted


def test_get_cached_returns_fresh_value(db):
    service = WordDetectionLockingService(db)
    key = (None, 7)
    service._set_cached(service._lesson_cache, key, True)
    assert service._get_cached(service._lesson_cache, key) is True


# ── Lesson locking ───────────────────────────────────────────────────────────


def test_nonexistent_lesson_is_locked(db):
    service = WordDetectionLockingService(db)
    assert service.is_lesson_locked(999_999_999, None) is True


def test_lesson_result_is_cached(db):
    service = WordDetectionLockingService(db)
    lesson_id = 999_999_998
    assert service.is_lesson_locked(lesson_id, None) is True
    # Cached value is served without recomputation.
    assert service._get_cached(service._lesson_cache, (None, lesson_id)) is True


def test_non_first_lesson_locked_for_guest(db):
    _, _, lessons = _make_unit_with_lessons(db, lesson_count=2)
    service = WordDetectionLockingService(db)
    # The prior of the second lesson exists; guest (user_id=None) cannot have
    # completed it, so the lesson stays locked.
    assert service.is_lesson_locked(lessons[1].id, None) is True


def test_lesson_unlocks_when_prior_completed(db):
    from src.repositories.word_detection.word_detection_curriculum_repository import (
        WordDetectionCurriculumRepository,
    )

    user = _make_user(db)
    _, _, lessons = _make_unit_with_lessons(db, lesson_count=2)
    service = WordDetectionLockingService(db)
    target = lessons[1]

    prior = WordDetectionCurriculumRepository(db).get_prior_lesson_in_curriculum_order(
        target.id
    )
    assert prior is not None

    # Locked before the prior lesson is completed.
    assert service.is_lesson_locked(target.id, user.id) is True

    db.add(
        WordDetectionUserLessonProgress(
            user_id=user.id,
            word_detection_lesson_id=prior.id,
            is_completed=True,
        )
    )
    db.flush()
    WordDetectionLockingService.clear_cache()

    assert service.is_lesson_locked(target.id, user.id) is False


# ── Chapter / unit locking ───────────────────────────────────────────────────


def test_empty_chapter_is_unlocked(db):
    suffix = unique_suffix()
    unit = WordDetectionUnit(
        name_en=f"U {suffix}", name_kh=f"ឯកតា {suffix}", order_index=safe_order_index()
    )
    db.add(unit)
    db.flush()
    chapter = WordDetectionChapter(
        unit_id=unit.id,
        name_en=f"C {suffix}",
        name_kh=f"ជំពូក {suffix}",
        order_index=safe_order_index(),
    )
    db.add(chapter)
    db.flush()

    service = WordDetectionLockingService(db)
    assert service.is_chapter_locked(chapter.id, None) is False


def test_empty_unit_is_unlocked(db):
    suffix = unique_suffix()
    unit = WordDetectionUnit(
        name_en=f"U {suffix}", name_kh=f"ឯកតា {suffix}", order_index=safe_order_index()
    )
    db.add(unit)
    db.flush()

    service = WordDetectionLockingService(db)
    assert service.is_unit_locked(unit.id, None) is False


def test_chapter_locked_when_all_lessons_locked(db):
    _make_preceding_unit(db)  # ensures this chapter has no global-first lesson
    _, chapter, _ = _make_unit_with_lessons(db, lesson_count=2)
    service = WordDetectionLockingService(db)
    # Guest with a non-first chapter: every lesson is locked -> chapter locked.
    assert service.is_chapter_locked(chapter.id, None) is True


def test_unit_locked_when_all_chapters_locked(db):
    _make_preceding_unit(db)  # ensures this unit has no global-first lesson
    unit, _, _ = _make_unit_with_lessons(db, lesson_count=2)
    service = WordDetectionLockingService(db)
    assert service.is_unit_locked(unit.id, None) is True


# ── Progress service ─────────────────────────────────────────────────────────


def test_progress_status_not_started_for_guest(db):
    service = WordDetectionProgressService(db)
    assert service.progress_status_for_lesson(None, 123) == "NOT_STARTED"


def test_progress_status_not_started_without_row(db):
    user = _make_user(db)
    service = WordDetectionProgressService(db)
    assert service.progress_status_for_lesson(user.id, 123) == "NOT_STARTED"


def test_progress_status_in_progress(db):
    user = _make_user(db)
    _, _, lessons = _make_unit_with_lessons(db, lesson_count=1)
    db.add(
        WordDetectionUserLessonProgress(
            user_id=user.id,
            word_detection_lesson_id=lessons[0].id,
            is_completed=False,
            attempts=1,
        )
    )
    db.flush()

    service = WordDetectionProgressService(db)
    assert service.progress_status_for_lesson(user.id, lessons[0].id) == "IN_PROGRESS"


def test_progress_status_completed(db):
    user = _make_user(db)
    _, _, lessons = _make_unit_with_lessons(db, lesson_count=1)
    db.add(
        WordDetectionUserLessonProgress(
            user_id=user.id,
            word_detection_lesson_id=lessons[0].id,
            is_completed=True,
        )
    )
    db.flush()

    service = WordDetectionProgressService(db)
    assert service.progress_status_for_lesson(user.id, lessons[0].id) == "COMPLETED"


def test_get_lesson_progress_returns_none_when_absent(db):
    user = _make_user(db)
    service = WordDetectionProgressService(db)
    assert service.get_lesson_progress(user.id, 999_999) is None


def test_update_last_practice_progress_sets_timestamp(db):
    user = _make_user(db)
    _, _, lessons = _make_unit_with_lessons(db, lesson_count=1)
    progress = WordDetectionUserLessonProgress(
        user_id=user.id,
        word_detection_lesson_id=lessons[0].id,
        last_practiced_at=None,
    )
    db.add(progress)
    db.flush()

    WordDetectionProgressService(db).update_last_practice_progress(progress)
    assert isinstance(progress.last_practiced_at, datetime)


def test_record_practice_attempt_marks_completed_and_counts(db):
    user = _make_user(db)
    _, _, lessons = _make_unit_with_lessons(db, lesson_count=1)
    service = WordDetectionProgressService(db)

    result = service.record_practice_attempt(
        user.id, lessons[0].id, predicted_confidence=0.8
    )

    assert result is not None
    assert result.is_completed is True
    assert result.is_locked is False
    assert result.attempts == 1
    assert result.predicted_confidence == pytest.approx(0.8)
    assert result.completed_at is not None


def test_record_practice_attempt_averages_confidence(db):
    user = _make_user(db)
    _, _, lessons = _make_unit_with_lessons(db, lesson_count=1)
    service = WordDetectionProgressService(db)

    service.record_practice_attempt(user.id, lessons[0].id, predicted_confidence=0.6)
    result = service.record_practice_attempt(
        user.id, lessons[0].id, predicted_confidence=1.0
    )

    assert result.attempts == 2
    # Running average: (0.6 + 1.0) / 2 = 0.8
    assert result.predicted_confidence == pytest.approx(0.8)


def test_complete_lesson_delegates_to_record_attempt(db):
    user = _make_user(db)
    _, _, lessons = _make_unit_with_lessons(db, lesson_count=1)
    service = WordDetectionProgressService(db)

    result = service.complete_lesson(user.id, lessons[0].id, predicted_confidence=0.5)
    assert result.is_completed is True
    assert result.attempts == 1


def test_is_lesson_locked_by_id_delegates(db):
    service = WordDetectionProgressService(db)
    assert service.is_lesson_locked_by_id(None, 999_999_997) is True
