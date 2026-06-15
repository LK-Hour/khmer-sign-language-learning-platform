"""
OAuth User Service
Finds or creates users from OAuth provider data in the database
"""

import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ..models.user import User
from ..models.user_oauth_provider import UserOAuthProvider
from ..models.finger_spelling import (
    FingerLesson,
    FingerPracticeSession,
    FingerUserExerciseResult,
    FingerUserLessonProgress,
)
from ..schemas.oauth import GuestProgressImportRequest


def _naive_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value.replace(tzinfo=None)


def find_or_create_oauth_user(
    db: Session,
    provider: str,
    provider_id: str,
    email: Optional[str],
    first_name: str,
    last_name: Optional[str],
    picture: Optional[str],
) -> User:
    """
    Find existing user by OAuth provider+id, or create a new one.
    Also links the OAuth provider record to the user.
    """
    # Check if this OAuth provider account is already linked
    oauth_link = (
        db.query(UserOAuthProvider)
        .filter(
            UserOAuthProvider.provider == provider,
            UserOAuthProvider.provider_user_id == provider_id,
        )
        .first()
    )

    if oauth_link:
        user = oauth_link.user
        # Update avatar/email if changed
        if picture:
            user.avatar_url = picture
        if email and not user.email:
            user.email = email
        oauth_link.provider_email = email
        oauth_link.provider_avatar_url = picture
        db.commit()
        db.refresh(user)
        return user

    # No existing link — check if user exists by email
    user = None
    if email:
        user = db.query(User).filter(User.email == email).first()

    # Create new user if not found
    if not user:
        display_name = f"{first_name} {last_name}".strip() if last_name else first_name
        username = f"{provider}_{provider_id}"
        user = User(
            username=username,
            email=email,
            display_name=display_name,
            avatar_url=picture,
            account_type="student",
            auth_provider=provider,
        )
        db.add(user)
        db.flush()

    # Create OAuth provider link
    oauth_link = UserOAuthProvider(
        user_id=user.id,
        provider=provider,
        provider_user_id=provider_id,
        provider_email=email,
        provider_avatar_url=picture,
    )
    db.add(oauth_link)
    db.commit()
    db.refresh(user)
    return user


def migrate_guest_progress_to_user(
    db: Session,
    *,
    guest_user_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> bool:
    """
    Move guest learning progress to a signed-in user.

    Returns True when migration was applied, False when skipped.
    """
    if guest_user_id == target_user_id:
        return False

    guest_user = db.query(User).filter(User.id == guest_user_id).first()
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if guest_user is None or target_user is None:
        return False
    if not guest_user.is_guest:
        return False

    # Merge lesson progress first because exercise results reference progress_id.
    guest_progress_rows = (
        db.query(FingerUserLessonProgress)
        .filter(FingerUserLessonProgress.user_id == guest_user_id)
        .all()
    )
    target_progress_map = {
        row.finger_lesson_id: row
        for row in db.query(FingerUserLessonProgress)
        .filter(FingerUserLessonProgress.user_id == target_user_id)
        .all()
    }

    progress_id_remap: dict[uuid.UUID, uuid.UUID] = {}
    for guest_progress in guest_progress_rows:
        existing_target = target_progress_map.get(guest_progress.finger_lesson_id)
        if existing_target is None:
            guest_progress.user_id = target_user_id
            target_progress_map[guest_progress.finger_lesson_id] = guest_progress
            progress_id_remap[guest_progress.id] = guest_progress.id
            continue

        # Merge into existing target row.
        existing_target.is_completed = bool(existing_target.is_completed or guest_progress.is_completed)
        if existing_target.completed_at is None or (
            guest_progress.completed_at is not None
            and guest_progress.completed_at < existing_target.completed_at
        ):
            existing_target.completed_at = guest_progress.completed_at

        existing_target.attempts = (existing_target.attempts or 0) + (guest_progress.attempts or 0)
        existing_target.total_time_spent = (existing_target.total_time_spent or 0) + (
            guest_progress.total_time_spent or 0
        )

        target_peak = float(existing_target.peak_accuracy) if existing_target.peak_accuracy is not None else 0.0
        guest_peak = float(guest_progress.peak_accuracy) if guest_progress.peak_accuracy is not None else 0.0
        if guest_peak > target_peak:
            existing_target.peak_accuracy = guest_progress.peak_accuracy

        if existing_target.started_at is None or (
            guest_progress.started_at is not None
            and guest_progress.started_at < existing_target.started_at
        ):
            existing_target.started_at = guest_progress.started_at

        if existing_target.last_accessed_at is None or (
            guest_progress.last_accessed_at is not None
            and guest_progress.last_accessed_at > existing_target.last_accessed_at
        ):
            existing_target.last_accessed_at = guest_progress.last_accessed_at

        progress_id_remap[guest_progress.id] = existing_target.id
        db.delete(guest_progress)

    # Repoint exercise results and normalize user ownership.
    guest_results = (
        db.query(FingerUserExerciseResult)
        .filter(FingerUserExerciseResult.user_id == guest_user_id)
        .all()
    )
    for result in guest_results:
        result.user_id = target_user_id
        result.progress_id = progress_id_remap.get(result.progress_id, result.progress_id)

    # Move practice sessions directly.
    (
        db.query(FingerPracticeSession)
        .filter(FingerPracticeSession.user_id == guest_user_id)
        .update({"user_id": target_user_id}, synchronize_session=False)
    )

    db.commit()
    return True


def import_local_guest_progress(
    db: Session,
    *,
    target_user_id: uuid.UUID,
    payload: GuestProgressImportRequest,
) -> tuple[int, int]:
    """Merge browser-local guest progress into a signed-in user."""
    lesson_ids = {
        item.lesson_id for item in payload.lessons
    } | {
        item.lesson_id for item in payload.practice_summaries
    }
    if payload.last_accessed_lesson_id is not None:
        lesson_ids.add(payload.last_accessed_lesson_id)

    valid_lesson_ids = {
        row[0]
        for row in db.query(FingerLesson.id)
        .filter(FingerLesson.id.in_(lesson_ids))
        .all()
    } if lesson_ids else set()

    target_progress_map = {
        row.finger_lesson_id: row
        for row in db.query(FingerUserLessonProgress)
        .filter(
            FingerUserLessonProgress.user_id == target_user_id,
            FingerUserLessonProgress.finger_lesson_id.in_(valid_lesson_ids),
        )
        .all()
    }

    imported = 0
    skipped = len(lesson_ids - valid_lesson_ids)

    def get_progress(lesson_id: int) -> FingerUserLessonProgress:
        progress = target_progress_map.get(lesson_id)
        if progress is not None:
            return progress
        progress = FingerUserLessonProgress(
            user_id=target_user_id,
            finger_lesson_id=lesson_id,
        )
        db.add(progress)
        db.flush()
        target_progress_map[lesson_id] = progress
        return progress

    for item in payload.lessons:
        if item.lesson_id not in valid_lesson_ids:
            continue
        progress = get_progress(item.lesson_id)
        progress.is_completed = bool(progress.is_completed or item.is_completed)
        progress.attempts = (progress.attempts or 0) + max(item.attempts, 0)
        progress.total_time_spent = (progress.total_time_spent or 0) + max(item.total_time_spent, 0)
        if item.peak_accuracy is not None:
            current_peak = float(progress.peak_accuracy) if progress.peak_accuracy is not None else 0.0
            progress.peak_accuracy = max(current_peak, item.peak_accuracy)
        started_at = _naive_datetime(item.started_at)
        completed_at = _naive_datetime(item.completed_at)
        last_accessed_at = _naive_datetime(item.last_accessed_at)
        if started_at and (progress.started_at is None or started_at < progress.started_at):
            progress.started_at = started_at
        if completed_at and (
            progress.completed_at is None or completed_at < progress.completed_at
        ):
            progress.completed_at = completed_at
        if last_accessed_at and (
            progress.last_accessed_at is None or last_accessed_at > progress.last_accessed_at
        ):
            progress.last_accessed_at = last_accessed_at
        imported += 1

    for summary in payload.practice_summaries:
        if summary.lesson_id not in valid_lesson_ids:
            continue
        progress = get_progress(summary.lesson_id)
        progress.attempts = (progress.attempts or 0) + max(summary.attempts, 0)
        progress.total_time_spent = (progress.total_time_spent or 0) + max(summary.total_time_spent, 0)
        if summary.best_accuracy is not None:
            current_peak = float(progress.peak_accuracy) if progress.peak_accuracy is not None else 0.0
            progress.peak_accuracy = max(current_peak, summary.best_accuracy)
        completed_at = _naive_datetime(summary.completed_at)
        if completed_at and (
            progress.last_accessed_at is None or completed_at > progress.last_accessed_at
        ):
            progress.last_accessed_at = completed_at
        imported += 1

    if (
        payload.last_accessed_lesson_id is not None
        and payload.last_accessed_lesson_id in valid_lesson_ids
    ):
        get_progress(payload.last_accessed_lesson_id)

    db.commit()
    return imported, skipped
