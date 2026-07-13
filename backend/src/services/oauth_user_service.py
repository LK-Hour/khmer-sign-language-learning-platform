"""
OAuth User Service
Finds or creates users from OAuth provider data in the database
"""

import uuid
from typing import Optional
from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from ..models.user import User
from ..models.user_oauth_provider import UserOAuthProvider
from ..models.finger_spelling import (
    FingerChapter,
    FingerExerciseAttempt,
    FingerLesson,
    FingerExerciseProgress,
    FingerUnit,
    FingerUserLessonProgress,
)
from ..repositories.finger_spelling.finger_chapter_practice_repository import (
    FingerChapterPracticeRepository,
)
from ..repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
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

        if existing_target.last_practiced_at is None or (
            guest_progress.last_practiced_at is not None
            and guest_progress.last_practiced_at > existing_target.last_practiced_at
        ):
            existing_target.last_practiced_at = guest_progress.last_practiced_at

        progress_id_remap[guest_progress.id] = existing_target.id
        db.delete(guest_progress)

    # Repoint exercise results and normalize user ownership.
    guest_results = (
        db.query(FingerExerciseProgress)
        .filter(FingerExerciseProgress.user_id == guest_user_id)
        .all()
    )
    for result in guest_results:
        result.user_id = target_user_id

    db.commit()
    return True


def import_local_guest_progress(
    db: Session,
    *,
    target_user_id: uuid.UUID,
    payload: GuestProgressImportRequest,
) -> tuple[int, int, int, int]:
    """Merge browser-local guest progress into a signed-in user.

    Returns (imported_lessons, skipped_lessons, imported_chapter_practices, imported_unit_exercises).
    """
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
    } if valid_lesson_ids else {}

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
        progress.attempts = (progress.attempts or 0) + max(item.attempt_count, 0)
        completed_at = _naive_datetime(item.completed_at)
        if completed_at and (
            progress.completed_at is None or completed_at < progress.completed_at
        ):
            progress.completed_at = completed_at
        imported += 1

    for summary in payload.practice_summaries:
        if summary.lesson_id not in valid_lesson_ids:
            continue
        progress = get_progress(summary.lesson_id)
        progress.attempts = (progress.attempts or 0) + max(summary.attempt_count, 0)
        completed_at = _naive_datetime(summary.completed_at)
        if completed_at and (
            progress.last_practiced_at is None or completed_at > progress.last_practiced_at
        ):
            progress.last_practiced_at = completed_at
        imported += 1

    if (
        payload.last_accessed_lesson_id is not None
        and payload.last_accessed_lesson_id in valid_lesson_ids
    ):
        get_progress(payload.last_accessed_lesson_id)

    imported_chapter_practices = 0
    chapter_ids = {item.chapter_id for item in payload.chapter_practices}
    valid_chapter_ids = {
        row[0]
        for row in db.query(FingerChapter.id)
        .filter(FingerChapter.id.in_(chapter_ids))
        .all()
    } if chapter_ids else set()

    practice_repo = FingerChapterPracticeRepository(db)
    curriculum = FingerCurriculumRepository(db)
    for item in payload.chapter_practices:
        if item.chapter_id not in valid_chapter_ids:
            continue
        lessons = curriculum.list_lessons_by_chapter(item.chapter_id)
        practice = practice_repo.get_or_create_practice(item.chapter_id, len(lessons))
        db.flush()
        practice_repo.upsert_user_progress(
            user_id=target_user_id,
            practice_id=practice.id,
            avg_score=float(item.avg_score or 0),
            is_complete=True,
        )
        imported_chapter_practices += 1

    imported_unit_exercises = 0
    unit_ids = {item.unit_id for item in payload.unit_exercises}
    valid_unit_ids = {
        row[0]
        for row in db.query(FingerUnit.id)
        .filter(FingerUnit.id.in_(unit_ids))
        .all()
    } if unit_ids else set()

    for item in payload.unit_exercises:
        if item.unit_id not in valid_unit_ids:
            continue
        question_ids = list(item.question_ids or [])
        max_score = max(item.max_score, len(question_ids), 1)
        score = max(0, min(item.score, max_score))
        completed_at = _naive_datetime(item.completed_at) or datetime.utcnow()
        attempt = FingerExerciseAttempt(
            id=uuid4(),
            user_id=target_user_id,
            unit_id=item.unit_id,
            question_ids=question_ids,
            score=score,
            max_score=max_score,
            is_completed=True,
            completed_at=completed_at,
        )
        db.add(attempt)
        imported_unit_exercises += 1

    db.commit()
    return imported, skipped, imported_chapter_practices, imported_unit_exercises
