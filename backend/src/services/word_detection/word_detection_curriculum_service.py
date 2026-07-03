"""Business logic for word detection curriculum reads (learner-facing).

Admin CRUD lives in ``src.services.admin.curriculum_admin_service``
(centralized, multi-track).
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from src.models.word_detection import (
    WordDetectionChapter,
    WordDetectionLesson,
    WordDetectionUnit,
    WordDetectionWord,
)
from src.models.media import Media
from src.models.publishable import is_live
from src.repositories.word_detection.word_detection_curriculum_repository import (
    WordDetectionCurriculumRepository,)
from src.repositories.word_detection.word_detection_progress_repository import (
    WordDetectionProgressRepository,
)


@dataclass
class WordWithMedia:
    word: WordDetectionWord
    order_index: int
    medias: list[Media] = field(default_factory=list)


@dataclass
class WdLessonDetailBundle:
    lesson: WordDetectionLesson
    chapter: WordDetectionChapter
    unit: WordDetectionUnit
    words: list[WordWithMedia]


class WordDetectionCurriculumService:
    """Learner-facing curriculum queries for Word Detection."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.curriculum = WordDetectionCurriculumRepository(db)
        self.progress = WordDetectionProgressRepository(db)

    # ──────────────────────────────────────────────────────────────────────
    # LEARNER-FACING READS
    # ──────────────────────────────────────────────────────────────────────

    def list_units(self, *, active_only: bool = True) -> list[WordDetectionUnit]:
        return self.curriculum.list_units(active_only=active_only)

    def get_unit(
        self, unit_id: int, *, active_only: bool = True
    ) -> WordDetectionUnit | None:
        return self.curriculum.get_unit_by_id(unit_id, active_only=active_only)

    def list_chapters_for_unit(
        self, unit_id: int, *, active_only: bool = True
    ) -> list[WordDetectionChapter] | None:
        if self.curriculum.get_unit_by_id(unit_id, active_only=active_only) is None:
            return None
        return self.curriculum.list_chapters_by_unit(unit_id, active_only=active_only)

    def get_chapter(
        self, chapter_id: int, *, active_only: bool = True
    ) -> WordDetectionChapter | None:
        return self.curriculum.get_chapter_by_id(chapter_id, active_only=active_only)

    def list_lessons_for_chapter(
        self, chapter_id: int, *, active_only: bool = True
    ) -> list[WordDetectionLesson] | None:
        if self.curriculum.get_chapter_by_id(chapter_id, active_only=active_only) is None:
            return None
        return self.curriculum.list_lessons_by_chapter(chapter_id, active_only=active_only)

    def get_lesson(
        self, lesson_id: int, *, active_only: bool = True
    ) -> WordDetectionLesson | None:
        return self.curriculum.get_lesson_by_id(lesson_id, active_only=active_only)

    def get_lesson_detail(
        self, lesson_id: int, *, active_only: bool = True
    ) -> WdLessonDetailBundle | None:
        lesson = self.curriculum.get_lesson_with_chapter(lesson_id, active_only=active_only)
        if lesson is None or lesson.chapter is None:
            return None

        chapter = lesson.chapter
        unit = chapter.unit
        if active_only and (not is_live(chapter) or (unit and not is_live(unit))):
            return None

        words: list[WordWithMedia] = []
        for junction, word in self.curriculum.list_words_for_lesson(
            lesson_id, active_only=active_only
        ):
            medias = self.curriculum.list_medias_for_word(word.id)
            words.append(
                WordWithMedia(word=word, order_index=junction.order_index, medias=medias)
            )

        return WdLessonDetailBundle(lesson=lesson, chapter=chapter, unit=unit, words=words)

    def count_chapters(self, unit_id: int, *, active_only: bool = True) -> int:
        return self.curriculum.count_chapters(unit_id, active_only=active_only)

    def count_lessons(self, chapter_id: int, *, active_only: bool = True) -> int:
        return self.curriculum.count_lessons(chapter_id, active_only=active_only)

    def count_lessons_in_unit(self, unit_id: int, *, active_only: bool = True) -> int:
        return self.curriculum.count_lessons_in_unit(unit_id, active_only=active_only)

    def count_completed_lessons(
        self, user_id: uuid.UUID | None, lesson_ids: list[int]
    ) -> int:
        if user_id is None or not lesson_ids:
            return 0
        return self.progress.count_completed_lessons(user_id, lesson_ids)

    def is_chapter_exercise_unlocked(
        self, user_id: uuid.UUID | None, chapter_id: int, *, active_only: bool = True
    ) -> bool:
        """All lessons in the chapter must be completed before chapter exercises unlock."""
        if user_id is None:
            return False
        lessons = self.curriculum.list_lessons_by_chapter(chapter_id, active_only=active_only)
        if not lessons:
            return False
        lesson_ids = [lesson.id for lesson in lessons]
        completed = self.progress.count_completed_lessons(user_id, lesson_ids)
        return completed >= len(lesson_ids)
