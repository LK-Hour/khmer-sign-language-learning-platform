"""Admin analytics routes.

Provides aggregate reporting endpoints for the admin analytics dashboard:
unified dashboard data, overview statistics, per-track completion rates,
top learner leaderboard, and per-lesson difficulty metrics.

    /api/admin/analytics                     GET  (unified dashboard)
    /api/admin/analytics/overview            GET
    /api/admin/analytics/track-completion    GET
    /api/admin/analytics/leaderboard         GET
    /api/admin/analytics/lesson-difficulty   GET
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, case, distinct
from sqlalchemy.orm import Session

from src.api.deps import get_admin_user, get_db
from src.models.user import User
from src.models.finger_spelling import (
    FingerLesson,
    FingerUserLessonProgress,
)
from src.models.word_detection import (
    WordDetectionLesson,
    WordDetectionUserLessonProgress,
)
from src.schemas.admin.analytics import (
    DashboardAnalyticsResponse,
    LeaderboardEntry,
    LessonDifficultyEntry,
    OverviewStats,
    TrackCompletionStats,
)
from src.services.admin.analytics_service import AnalyticsService

router = APIRouter(
    prefix="/api/admin/analytics",
    tags=["admin-analytics"],
)


@router.get("", response_model=DashboardAnalyticsResponse)
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Unified analytics endpoint for the admin dashboard."""
    service = AnalyticsService(db)
    return service.get_dashboard_data()


@router.get("/overview", response_model=OverviewStats)
def get_overview_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Aggregate total_users, total_lessons_completed, active_learners_today."""
    # Total registered users
    total_users = db.query(func.count(User.id)).scalar() or 0

    # Total lessons completed across both tracks
    finger_completed = (
        db.query(func.count(FingerUserLessonProgress.id))
        .filter(FingerUserLessonProgress.is_completed.is_(True))
        .scalar()
        or 0
    )
    word_completed = (
        db.query(func.count(WordDetectionUserLessonProgress.id))
        .filter(WordDetectionUserLessonProgress.is_completed.is_(True))
        .scalar()
        or 0
    )
    total_lessons_completed = finger_completed + word_completed

    # Active learners today: users with last_login_at in the last 24 hours
    # OR users with progress records updated in the last 24 hours
    now = datetime.now(timezone.utc)
    twenty_four_hours_ago = now - timedelta(hours=24)

    # Users who logged in recently — label as "uid" for consistent union
    login_active = (
        db.query(User.id.label("uid"))
        .filter(User.last_login_at >= twenty_four_hours_ago)
    )

    # Users with finger spelling progress in last 24 hours
    finger_active = (
        db.query(FingerUserLessonProgress.user_id.label("uid"))
        .filter(FingerUserLessonProgress.last_practiced_at >= twenty_four_hours_ago)
    )

    # Users with word detection progress in last 24 hours
    word_active = (
        db.query(WordDetectionUserLessonProgress.user_id.label("uid"))
        .filter(WordDetectionUserLessonProgress.last_practiced_at >= twenty_four_hours_ago)
    )

    # Union all active user IDs and count distinct
    active_union = login_active.union(finger_active, word_active).subquery()
    active_learners_today = (
        db.query(func.count(distinct(active_union.c.uid))).scalar() or 0
    )

    return OverviewStats(
        total_users=total_users,
        total_lessons_completed=total_lessons_completed,
        active_learners_today=active_learners_today,
    )


@router.get("/track-completion", response_model=list[TrackCompletionStats])
def get_track_completion(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Per-track completion rates."""
    # Finger spelling track
    finger_total_lessons = db.query(func.count(FingerLesson.id)).scalar() or 0
    finger_completed_lessons = (
        db.query(func.count(distinct(FingerUserLessonProgress.finger_lesson_id)))
        .filter(FingerUserLessonProgress.is_completed.is_(True))
        .scalar()
        or 0
    )
    finger_rate = (
        (finger_completed_lessons / finger_total_lessons * 100)
        if finger_total_lessons > 0
        else 0.0
    )

    # Word detection track
    word_total_lessons = db.query(func.count(WordDetectionLesson.id)).scalar() or 0
    word_completed_lessons = (
        db.query(func.count(distinct(WordDetectionUserLessonProgress.word_detection_lesson_id)))
        .filter(WordDetectionUserLessonProgress.is_completed.is_(True))
        .scalar()
        or 0
    )
    word_rate = (
        (word_completed_lessons / word_total_lessons * 100)
        if word_total_lessons > 0
        else 0.0
    )

    return [
        TrackCompletionStats(
            track="finger",
            completed_lessons=finger_completed_lessons,
            total_lessons=finger_total_lessons,
            completion_rate=round(finger_rate, 2),
        ),
        TrackCompletionStats(
            track="word_detection",
            completed_lessons=word_completed_lessons,
            total_lessons=word_total_lessons,
            completion_rate=round(word_rate, 2),
        ),
    ]


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Top 10 users by lessons completed across both tracks."""
    # Count completed lessons per user from finger spelling
    finger_counts = (
        db.query(
            FingerUserLessonProgress.user_id.label("user_id"),
            func.count(FingerUserLessonProgress.id).label("completed"),
        )
        .filter(FingerUserLessonProgress.is_completed.is_(True))
        .group_by(FingerUserLessonProgress.user_id)
        .subquery()
    )

    # Count completed lessons per user from word detection
    word_counts = (
        db.query(
            WordDetectionUserLessonProgress.user_id.label("user_id"),
            func.count(WordDetectionUserLessonProgress.id).label("completed"),
        )
        .filter(WordDetectionUserLessonProgress.is_completed.is_(True))
        .group_by(WordDetectionUserLessonProgress.user_id)
        .subquery()
    )

    # Combine counts: total = finger_completed + word_completed
    total_completed = (
        func.coalesce(finger_counts.c.completed, 0)
        + func.coalesce(word_counts.c.completed, 0)
    ).label("total_completed")

    # Get the most recent activity date from both tracks
    finger_last = (
        db.query(
            FingerUserLessonProgress.user_id.label("user_id"),
            func.max(FingerUserLessonProgress.last_practiced_at).label("last_active"),
        )
        .group_by(FingerUserLessonProgress.user_id)
        .subquery()
    )

    word_last = (
        db.query(
            WordDetectionUserLessonProgress.user_id.label("user_id"),
            func.max(WordDetectionUserLessonProgress.last_practiced_at).label("last_active"),
        )
        .group_by(WordDetectionUserLessonProgress.user_id)
        .subquery()
    )

    # Main query joining user with completion counts
    query = (
        db.query(
            User.id,
            User.display_name,
            User.avatar_url,
            total_completed,
            func.greatest(
                func.coalesce(finger_last.c.last_active, User.last_login_at),
                func.coalesce(word_last.c.last_active, User.last_login_at),
            ).label("last_active_at"),
        )
        .outerjoin(finger_counts, User.id == finger_counts.c.user_id)
        .outerjoin(word_counts, User.id == word_counts.c.user_id)
        .outerjoin(finger_last, User.id == finger_last.c.user_id)
        .outerjoin(word_last, User.id == word_last.c.user_id)
        .filter(
            # Only include users who completed at least one lesson
            (func.coalesce(finger_counts.c.completed, 0) + func.coalesce(word_counts.c.completed, 0)) > 0
        )
        .order_by(total_completed.desc())
        .limit(limit)
        .all()
    )

    results = []
    for rank, row in enumerate(query, start=1):
        results.append(
            LeaderboardEntry(
                rank=rank,
                user_id=row[0],
                display_name=row[1],
                avatar_url=row[2],
                total_completed=row[3],
                last_active_at=row[4],
            )
        )

    return results


@router.get("/lesson-difficulty", response_model=list[LessonDifficultyEntry])
def get_lesson_difficulty(
    track: str = Query("finger", pattern="^(finger|word_detection)$"),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Per-lesson avg_attempts, completion_rate, unique_users."""
    if track == "finger":
        # Query finger spelling lesson difficulty
        results = (
            db.query(
                FingerLesson.id.label("lesson_id"),
                FingerLesson.name_kh.label("lesson_name"),
                func.avg(FingerUserLessonProgress.attempts).label("avg_attempts"),
                (
                    func.sum(
                        case(
                            (FingerUserLessonProgress.is_completed.is_(True), 1),
                            else_=0,
                        )
                    )
                    * 100.0
                    / func.count(FingerUserLessonProgress.id)
                ).label("completion_rate"),
                func.count(distinct(FingerUserLessonProgress.user_id)).label("unique_users"),
            )
            .join(
                FingerUserLessonProgress,
                FingerLesson.id == FingerUserLessonProgress.finger_lesson_id,
            )
            .group_by(FingerLesson.id, FingerLesson.name_kh)
            .all()
        )
    else:
        # Query word detection lesson difficulty
        results = (
            db.query(
                WordDetectionLesson.id.label("lesson_id"),
                WordDetectionLesson.name_kh.label("lesson_name"),
                func.avg(WordDetectionUserLessonProgress.attempts).label("avg_attempts"),
                (
                    func.sum(
                        case(
                            (WordDetectionUserLessonProgress.is_completed.is_(True), 1),
                            else_=0,
                        )
                    )
                    * 100.0
                    / func.count(WordDetectionUserLessonProgress.id)
                ).label("completion_rate"),
                func.count(distinct(WordDetectionUserLessonProgress.user_id)).label("unique_users"),
            )
            .join(
                WordDetectionUserLessonProgress,
                WordDetectionLesson.id == WordDetectionUserLessonProgress.word_detection_lesson_id,
            )
            .group_by(WordDetectionLesson.id, WordDetectionLesson.name_kh)
            .all()
        )

    return [
        LessonDifficultyEntry(
            lesson_id=row[0],
            lesson_name=row[1],
            avg_attempts=round(float(row[2]), 2) if row[2] else 0.0,
            completion_rate=round(float(row[3]), 2) if row[3] else 0.0,
            unique_users=row[4],
        )
        for row in results
    ]
