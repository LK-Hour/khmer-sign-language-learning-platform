"""Business logic for finger spelling curriculum reads."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from src.models.finger_spelling import (
    FingerChapter,
    FingerLesson,
    FingerLetter,
    FingerUnit,
)
from src.models.media import Media
from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.repositories.finger_spelling.finger_progress_repository import (
    FingerProgressRepository,
)


@dataclass
class LetterWithMedia:
    letter: FingerLetter
    order_index: int
    medias: list[Media] = field(default_factory=list)


@dataclass
class LessonDetailBundle:
    lesson: FingerLesson
    chapter: FingerChapter
    unit: FingerUnit
    letters: list[LetterWithMedia]


@dataclass
class LessonPathRow:
    lesson: FingerLesson
    chapter: FingerChapter
    unit: FingerUnit


@dataclass
class LetterDataBundle:
    letter: FingerLetter
    medias: list[Media]
    lesson_paths: list[LessonPathRow]


class FingerCurriculumService:
    """Learner-facing curriculum queries with hierarchy validation."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.curriculum = FingerCurriculumRepository(db)
        self.progress = FingerProgressRepository(db)

    def list_units(self, *, active_only: bool = True) -> list[FingerUnit]:
        return self.curriculum.list_units(active_only=active_only)

    def get_unit(self, unit_id: int, *, active_only: bool = True) -> FingerUnit | None:
        return self.curriculum.get_unit_by_id(unit_id, active_only=active_only)

    def list_chapters_for_unit(
        self, unit_id: int, *, active_only: bool = True
    ) -> list[FingerChapter] | None:
        if self.curriculum.get_unit_by_id(unit_id, active_only=active_only) is None:
            return None
        return self.curriculum.list_chapters_by_unit(unit_id, active_only=active_only)

    def get_chapter(
        self, chapter_id: int, *, active_only: bool = True
    ) -> FingerChapter | None:
        return self.curriculum.get_chapter_by_id(chapter_id, active_only=active_only)

    def list_lessons_for_chapter(
        self, chapter_id: int, *, active_only: bool = True
    ) -> list[FingerLesson] | None:
        if self.curriculum.get_chapter_by_id(chapter_id, active_only=active_only) is None:
            return None
        return self.curriculum.list_lessons_by_chapter(chapter_id, active_only=active_only)

    def get_lesson(self, lesson_id: int, *, active_only: bool = True) -> FingerLesson | None:
        return self.curriculum.get_lesson_by_id(lesson_id, active_only=active_only)

    def get_lesson_detail(
        self, lesson_id: int, *, active_only: bool = True
    ) -> LessonDetailBundle | None:
        lesson = self.curriculum.get_lesson_with_chapter(lesson_id, active_only=active_only)
        if lesson is None or lesson.chapter is None:
            return None

        chapter = lesson.chapter
        unit = chapter.unit
        if active_only and (not chapter.is_active or (unit and not unit.is_active)):
            return None

        letters: list[LetterWithMedia] = []
        for junction, letter in self.curriculum.list_letters_for_lesson(
            lesson_id, active_only=active_only
        ):
            medias = self.curriculum.list_medias_for_letter(letter.id)
            letters.append(
                LetterWithMedia(letter=letter, order_index=junction.order_index, medias=medias)
            )

        return LessonDetailBundle(lesson=lesson, chapter=chapter, unit=unit, letters=letters)

    def get_letter(self, letter_id: int, *, active_only: bool = True) -> FingerLetter | None:
        return self.curriculum.get_letter_with_medias(letter_id, active_only=active_only)

    def get_letter_by_kh(self, letter_kh: str, *, active_only: bool = True) -> FingerLetter | None:
        return self.curriculum.get_letter_by_kh(letter_kh, active_only=active_only)

    def get_letter_data_by_kh(
        self, letter_kh: str, *, active_only: bool = True
    ) -> LetterDataBundle | None:
        letter = self.curriculum.get_letter_by_kh(letter_kh, active_only=active_only)
        if letter is None:
            return None

        medias = self.curriculum.list_medias_for_letter(letter.id)
        paths = self.curriculum.list_lesson_paths_for_letter(letter.id, active_only=active_only)
        lesson_paths = [
            LessonPathRow(lesson=lesson, chapter=chapter, unit=unit)
            for lesson, chapter, unit in paths
        ]
        return LetterDataBundle(letter=letter, medias=medias, lesson_paths=lesson_paths)

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
