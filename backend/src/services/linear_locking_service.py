"""Shared business logic for linear curriculum locking (unit -> chapter -> lesson).

Both the finger-spelling and word-detection tracks unlock content linearly along
the full curriculum tree. This module holds the shared traversal + caching logic;
each track subclasses :class:`LinearLockingService` and wires in its own
repositories.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import ClassVar, Dict, Protocol, Tuple

from sqlalchemy.orm import Session


class _LessonRow(Protocol):
    id: int


class _LessonProgressRow(Protocol):
    is_completed: bool


class CurriculumLockingRepository(Protocol):
    """Curriculum lookups required to compute lock state."""

    def get_lesson_by_id(self, lesson_id: int) -> object | None: ...

    def is_first_lesson_in_curriculum(self, lesson_id: int) -> bool: ...

    def get_prior_lesson_in_curriculum_order(
        self, lesson_id: int
    ) -> _LessonRow | None: ...

    def list_lessons_by_chapter(
        self, chapter_id: int, *, active_only: bool = ...
    ) -> list[_LessonRow]: ...

    def list_chapters_by_unit(
        self, unit_id: int, *, active_only: bool = ...
    ) -> list[_LessonRow]: ...


class ProgressLockingRepository(Protocol):
    """Progress lookups required to compute lock state."""

    def get_lesson_progress(
        self, user_id: uuid.UUID, lesson_id: int
    ) -> _LessonProgressRow | None: ...


_CacheKey = Tuple["uuid.UUID | None", int]
_Cache = Dict[_CacheKey, Tuple[bool, datetime]]


class LinearLockingService:
    """
    Linear unlock along the full curriculum tree.

    Only the first lesson (unit 1, chapter 1, lesson 1 by ``order_index``) starts
    unlocked. Each next lesson unlocks when the immediately prior lesson in global
    order is completed.

    A chapter is locked when every lesson inside it is locked.
    A unit is locked when every chapter inside it is locked.

    Uses in-memory caching (5 minutes TTL) to avoid repeated queries. Each
    subclass gets its own set of caches so tracks never share lock state.

    Subclasses must set :attr:`curriculum_repository_cls` and
    :attr:`progress_repository_cls`.
    """

    curriculum_repository_cls: ClassVar[type[CurriculumLockingRepository]]
    progress_repository_cls: ClassVar[type[ProgressLockingRepository]]

    CACHE_TTL_SECONDS: ClassVar[int] = 300

    _lesson_cache: ClassVar[_Cache]
    _chapter_cache: ClassVar[_Cache]
    _unit_cache: ClassVar[_Cache]

    def __init_subclass__(cls, **kwargs: object) -> None:
        super().__init_subclass__(**kwargs)
        # Fresh, per-subclass caches so finger-spelling and word-detection lock
        # states never collide on shared lesson/chapter/unit ids.
        cls._lesson_cache = {}
        cls._chapter_cache = {}
        cls._unit_cache = {}

    def __init__(self, db: Session) -> None:
        self.db = db
        self.curriculum = self.curriculum_repository_cls(db)
        self.progress = self.progress_repository_cls(db)

    @classmethod
    def clear_cache(cls) -> None:
        """Clear cached lock states (call after progress updates)."""
        cls._lesson_cache.clear()
        cls._chapter_cache.clear()
        cls._unit_cache.clear()

    @classmethod
    def _is_cache_expired(cls, timestamp: datetime) -> bool:
        now = datetime.now()
        return (now - timestamp).total_seconds() > cls.CACHE_TTL_SECONDS

    def _get_cached(self, cache: _Cache, key: _CacheKey) -> bool | None:
        if key in cache:
            value, timestamp = cache[key]
            if not self._is_cache_expired(timestamp):
                return value
            del cache[key]
        return None

    def _set_cached(self, cache: _Cache, key: _CacheKey, value: bool) -> None:
        cache[key] = (value, datetime.now())

    def _compute_lesson_locked(self, lesson_id: int, user_id: uuid.UUID | None) -> bool:
        if self.curriculum.get_lesson_by_id(lesson_id) is None:
            return True

        if self.curriculum.is_first_lesson_in_curriculum(lesson_id):
            return False

        prior = self.curriculum.get_prior_lesson_in_curriculum_order(lesson_id)
        if prior is None:
            return True

        if user_id is None:
            return True

        prior_progress = self.progress.get_lesson_progress(user_id, prior.id)
        return prior_progress is None or not prior_progress.is_completed

    def is_lesson_locked(self, lesson_id: int, user_id: uuid.UUID | None) -> bool:
        cache_key = (user_id, lesson_id)
        cached = self._get_cached(self._lesson_cache, cache_key)
        if cached is not None:
            return cached

        is_locked = self._compute_lesson_locked(lesson_id, user_id)
        self._set_cached(self._lesson_cache, cache_key, is_locked)
        return is_locked

    def is_chapter_locked(self, chapter_id: int, user_id: uuid.UUID | None) -> bool:
        cache_key = (user_id, chapter_id)
        cached = self._get_cached(self._chapter_cache, cache_key)
        if cached is not None:
            return cached

        lessons = self.curriculum.list_lessons_by_chapter(chapter_id, active_only=True)
        if not lessons:
            is_locked = False
        else:
            is_locked = all(
                self.is_lesson_locked(lesson.id, user_id) for lesson in lessons
            )

        self._set_cached(self._chapter_cache, cache_key, is_locked)
        return is_locked

    def is_unit_locked(self, unit_id: int, user_id: uuid.UUID | None) -> bool:
        cache_key = (user_id, unit_id)
        cached = self._get_cached(self._unit_cache, cache_key)
        if cached is not None:
            return cached

        chapters = self.curriculum.list_chapters_by_unit(unit_id, active_only=True)
        if not chapters:
            is_locked = False
        else:
            is_locked = all(
                self.is_chapter_locked(chapter.id, user_id) for chapter in chapters
            )

        self._set_cached(self._unit_cache, cache_key, is_locked)
        return is_locked
