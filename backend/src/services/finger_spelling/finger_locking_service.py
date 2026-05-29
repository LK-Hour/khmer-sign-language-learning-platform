"""Business logic for chapter and unit locking based on lesson lock states."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, Tuple

from sqlalchemy.orm import Session

from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.repositories.finger_spelling.finger_progress_repository import (
    FingerProgressRepository,
)


class FingerLockingService:
    """
    Computes chapter and unit lock status based on lesson lock states.

    A chapter is locked if ALL its lessons are locked.
    A unit is locked if ALL its chapters are locked.

    Uses in-memory caching (5 minutes TTL) to avoid repeated queries.
    """

    # Cache structure: (user_id, entity_id) -> (is_locked: bool, timestamp: datetime)
    _lesson_cache: Dict[Tuple[uuid.UUID | None, int], Tuple[bool, datetime]] = {}
    _chapter_cache: Dict[Tuple[uuid.UUID | None, int], Tuple[bool, datetime]] = {}
    _unit_cache: Dict[Tuple[uuid.UUID | None, int], Tuple[bool, datetime]] = {}

    CACHE_TTL_SECONDS = 300  # 5 minutes

    def __init__(self, db: Session) -> None:
        self.db = db
        self.curriculum = FingerCurriculumRepository(db)
        self.progress = FingerProgressRepository(db)

    @classmethod
    def _clear_cache(cls) -> None:
        """Clear all cached lock states (for testing or manual reset)."""
        cls._lesson_cache.clear()
        cls._chapter_cache.clear()
        cls._unit_cache.clear()

    @classmethod
    def _is_cache_expired(cls, timestamp: datetime) -> bool:
        """Check if a cache entry has expired."""
        now = datetime.now()
        return (now - timestamp).total_seconds() > cls.CACHE_TTL_SECONDS

    def _get_cached(
        self,
        cache: Dict[Tuple[uuid.UUID | None, int], Tuple[bool, datetime]],
        key: Tuple[uuid.UUID | None, int],
    ) -> bool | None:
        """Retrieve cached value if not expired."""
        if key in cache:
            value, timestamp = cache[key]
            if not self._is_cache_expired(timestamp):
                return value
            else:
                del cache[key]
        return None

    def _set_cached(
        self,
        cache: Dict[Tuple[uuid.UUID | None, int], Tuple[bool, datetime]],
        key: Tuple[uuid.UUID | None, int],
        value: bool,
    ) -> None:
        """Store value in cache with timestamp."""
        now = datetime.now()
        cache[key] = (value, now)

    def is_lesson_locked(self, lesson_id: int, user_id: uuid.UUID | None) -> bool:
        """
        Check if a lesson is locked for a user.

        If no user_id, returns False (anonymous users can't be locked).
        """
        if user_id is None:
            return False

        cache_key = (user_id, lesson_id)
        cached = self._get_cached(self._lesson_cache, cache_key)
        if cached is not None:
            return cached

        # Query the database
        progress = self.progress.get_lesson_progress(user_id, lesson_id)
        is_locked = progress.is_locked if progress else False

        self._set_cached(self._lesson_cache, cache_key, is_locked)
        return is_locked

    def is_chapter_locked(self, chapter_id: int, user_id: uuid.UUID | None) -> bool:
        """
        Check if a chapter is locked for a user.

        A chapter is locked if ALL its lessons are locked.
        """
        if user_id is None:
            return False

        cache_key = (user_id, chapter_id)
        cached = self._get_cached(self._chapter_cache, cache_key)
        if cached is not None:
            return cached

        # Get all lessons in this chapter
        lessons = self.curriculum.list_lessons_by_chapter(chapter_id, active_only=True)
        if not lessons:
            # No lessons in chapter -> not locked
            is_locked = False
        else:
            # Chapter is locked if ALL lessons are locked
            is_locked = all(
                self.is_lesson_locked(lesson.id, user_id) for lesson in lessons
            )

        self._set_cached(self._chapter_cache, cache_key, is_locked)
        return is_locked

    def is_unit_locked(self, unit_id: int, user_id: uuid.UUID | None) -> bool:
        """
        Check if a unit is locked for a user.

        A unit is locked if ALL its chapters are locked.
        """
        if user_id is None:
            return False

        cache_key = (user_id, unit_id)
        cached = self._get_cached(self._unit_cache, cache_key)
        if cached is not None:
            return cached

        # Get all chapters in this unit
        chapters = self.curriculum.list_chapters_by_unit(unit_id, active_only=True)
        if not chapters:
            # No chapters in unit -> not locked
            is_locked = False
        else:
            # Unit is locked if ALL chapters are locked
            is_locked = all(
                self.is_chapter_locked(chapter.id, user_id) for chapter in chapters
            )

        self._set_cached(self._unit_cache, cache_key, is_locked)
        return is_locked
