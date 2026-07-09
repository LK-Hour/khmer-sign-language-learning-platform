"""Business logic for chapter-level finger-spelling practice sessions.

Distinct from ``FingerPracticeService`` which handles per-lesson attempt
recording. This service manages the chapter-wide practice flow:
  - Building the ordered list of letters/items for a chapter practice session.
  - Resolving the practice-glyph image URL for each letter.
  - Checking whether practice is unlocked (all lessons in chapter completed).
  - Persisting the overall session result.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from src.repositories.finger_spelling.finger_chapter_practice_repository import (
    FingerChapterPracticeRepository,
)
from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.repositories.finger_spelling.finger_progress_repository import (
    FingerProgressRepository,
)
from src.services.finger_spelling.finger_practice_image_service import (
    media_file_url_to_serve_url,
    resolve_practice_image_url,
    resolve_practice_image_url_from_medias,
)

_PLACEHOLDER_PRACTICE_IMAGE = "/finger-spelling/placeholder-sign.svg"


@dataclass
class FsPracticeItem:
    """One letter in a chapter practice session."""
    lesson_id: int
    letter_id: int
    letter_kh: str
    letter_en: str | None
    order_index: int
    practice_image_url: str


@dataclass
class FsChapterPracticeSession:
    """Full context needed to render a chapter practice page."""
    chapter_id: int
    chapter_title: str
    chapter_title_kh: str
    unit_id: int
    unit_title: str
    unit_title_kh: str
    is_unlocked: bool
    practice_id: int | None          # None if practice row doesn't exist yet
    items: list[FsPracticeItem] = field(default_factory=list)
    # Per-user progress (None for guests / unauthenticated)
    is_complete: bool = False
    attempts: int = 0
    avg_score: float = 0.0


@dataclass
class ChapterPracticeResultData:
    chapter_id: int
    practice_id: int
    avg_score: float
    is_complete: bool
    attempts: int


class FingerChapterPracticeService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.curriculum = FingerCurriculumRepository(db)
        self.progress = FingerProgressRepository(db)
        self.practice_repo = FingerChapterPracticeRepository(db)

    # ── Unlock check ──────────────────────────────────────────────────────────

    def is_practice_unlocked(
        self, user_id: uuid.UUID | None, chapter_id: int
    ) -> bool:
        """Practice unlocks when every lesson in the chapter is completed."""
        if user_id is None:
            return False
        lesson_ids = self.curriculum.list_lesson_ids_for_chapter(chapter_id)
        if not lesson_ids:
            return False
        completed = self.progress.count_completed_lessons(user_id, lesson_ids)
        return completed >= len(lesson_ids)

    def is_practice_complete(
        self, user_id: uuid.UUID | None, chapter_id: int
    ) -> bool:
        if user_id is None:
            return False
        return self.practice_repo.is_practice_complete(user_id, chapter_id)

    # ── Session data ──────────────────────────────────────────────────────────

    def get_practice_session(
        self, user_id: uuid.UUID | None, chapter_id: int
    ) -> FsChapterPracticeSession | None:
        """Return full session data for a chapter practice.

        Returns None if the chapter does not exist.
        """
        chapter = self.curriculum.get_chapter_by_id(chapter_id)
        if chapter is None:
            return None

        unit = self.curriculum.get_unit_by_id(chapter.unit_id)
        if unit is None:
            return None

        is_unlocked = self.is_practice_unlocked(user_id, chapter_id)

        # Resolve items (even when locked, so the page can show the count)
        lessons = self.curriculum.list_lessons_by_chapter(chapter_id)
        practice = self.practice_repo.get_practice_by_chapter(chapter_id)
        practice_medias = (
            self.practice_repo.list_practice_medias(practice.id)
            if practice is not None
            else []
        )
        items: list[FsPracticeItem] = []
        for lesson in lessons:
            letter = self.curriculum.get_primary_letter_for_lesson(lesson.id)
            if letter is None:
                continue
            image_url = resolve_practice_image_url_from_medias(
                letter.letter_kh, practice_medias
            )
            if image_url is None:
                image_url = resolve_practice_image_url(letter.letter_kh)
            items.append(
                FsPracticeItem(
                    lesson_id=lesson.id,
                    letter_id=letter.id,
                    letter_kh=letter.letter_kh,
                    letter_en=letter.letter_en,
                    order_index=lesson.order_index,
                    practice_image_url=image_url or _PLACEHOLDER_PRACTICE_IMAGE,
                )
            )

        # Load existing practice row if present (may have been fetched above)
        practice_id = practice.id if practice else None

        # Per-user progress
        is_complete = False
        attempts = 0
        avg_score = 0.0
        if user_id is not None and practice is not None:
            user_progress = self.practice_repo.get_user_progress(user_id, practice.id)
            if user_progress is not None:
                is_complete = user_progress.is_complete
                attempts = user_progress.attempts or 0
                avg_score = user_progress.avg_score or 0.0

        return FsChapterPracticeSession(
            chapter_id=chapter.id,
            chapter_title=chapter.name_en,
            chapter_title_kh=chapter.name_kh,
            unit_id=unit.id,
            unit_title=unit.name_en,
            unit_title_kh=unit.name_kh,
            is_unlocked=is_unlocked,
            practice_id=practice_id,
            items=items,
            is_complete=is_complete,
            attempts=attempts,
            avg_score=avg_score,
        )

    # ── Record result ─────────────────────────────────────────────────────────

    def record_session_result(
        self,
        *,
        user_id: uuid.UUID,
        chapter_id: int,
        avg_score: float,
        is_complete: bool,
    ) -> ChapterPracticeResultData | None:
        """Persist a completed practice session result.

        Returns None if the chapter doesn't exist.
        """
        chapter = self.curriculum.get_chapter_by_id(chapter_id)
        if chapter is None:
            return None

        lessons = self.curriculum.list_lessons_by_chapter(chapter_id)
        lesson_count = len(lessons)

        practice = self.practice_repo.get_or_create_practice(chapter_id, lesson_count)
        self.db.flush()

        progress = self.practice_repo.upsert_user_progress(
            user_id=user_id,
            practice_id=practice.id,
            avg_score=avg_score,
            is_complete=is_complete,
        )
        self.db.commit()
        self.db.refresh(progress)

        return ChapterPracticeResultData(
            chapter_id=chapter_id,
            practice_id=practice.id,
            avg_score=avg_score,
            is_complete=is_complete,
            attempts=progress.attempts or 1,
        )
