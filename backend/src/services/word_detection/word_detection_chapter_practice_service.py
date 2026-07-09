"""Business logic for chapter-level word-detection practice sessions."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from pathlib import Path

from sqlalchemy.orm import Session

from src.repositories.word_detection.word_detection_chapter_practice_repository import (
    WordDetectionChapterPracticeRepository,
)
from src.repositories.word_detection.word_detection_curriculum_repository import (
    WordDetectionCurriculumRepository,
)
from src.repositories.word_detection.word_detection_progress_repository import (
    WordDetectionProgressRepository,
)
from src.services.finger_spelling.finger_practice_image_service import (
    media_file_url_to_serve_url,
)

_PLACEHOLDER_PRACTICE_IMAGE = "/word-detection/placeholder-sign.svg"


def _resolve_practice_image_url_from_medias(word_kh: str, medias) -> str | None:
    """Match practice PNG by filename stem == word_kh."""
    if not medias:
        return None
    for media in medias:
        file_url = getattr(media, "file_url", None)
        if not file_url:
            continue
        if Path(file_url).stem == word_kh:
            return media_file_url_to_serve_url(file_url)
    return None


@dataclass
class WdPracticeItem:
    lesson_id: int
    word_id: int
    word_kh: str
    word_en: str | None
    order_index: int
    practice_image_url: str


@dataclass
class WdChapterPracticeSession:
    chapter_id: int
    chapter_title: str
    chapter_title_kh: str
    unit_id: int
    unit_title: str
    unit_title_kh: str
    is_unlocked: bool
    practice_id: int | None
    items: list[WdPracticeItem] = field(default_factory=list)
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


class WordDetectionChapterPracticeService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.curriculum = WordDetectionCurriculumRepository(db)
        self.progress = WordDetectionProgressRepository(db)
        self.practice_repo = WordDetectionChapterPracticeRepository(db)

    def is_practice_unlocked(
        self, user_id: uuid.UUID | None, chapter_id: int
    ) -> bool:
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

    def get_practice_session(
        self, user_id: uuid.UUID | None, chapter_id: int
    ) -> WdChapterPracticeSession | None:
        chapter = self.curriculum.get_chapter_by_id(chapter_id)
        if chapter is None:
            return None

        unit = self.curriculum.get_unit_by_id(chapter.unit_id)
        if unit is None:
            return None

        is_unlocked = self.is_practice_unlocked(user_id, chapter_id)

        lessons = self.curriculum.list_lessons_by_chapter(chapter_id)
        practice = self.practice_repo.get_practice_by_chapter(chapter_id)
        practice_medias = (
            self.practice_repo.list_practice_medias(practice.id)
            if practice is not None
            else []
        )

        items: list[WdPracticeItem] = []
        for lesson in lessons:
            word = self.curriculum.get_primary_word_for_lesson(lesson.id)
            if word is None:
                continue
            image_url = _resolve_practice_image_url_from_medias(
                word.word_kh, practice_medias
            )
            items.append(
                WdPracticeItem(
                    lesson_id=lesson.id,
                    word_id=word.id,
                    word_kh=word.word_kh,
                    word_en=word.word_en,
                    order_index=lesson.order_index,
                    practice_image_url=image_url or _PLACEHOLDER_PRACTICE_IMAGE,
                )
            )

        practice_id = practice.id if practice else None
        is_complete = False
        attempts = 0
        avg_score = 0.0
        if user_id is not None and practice is not None:
            user_progress = self.practice_repo.get_user_progress(user_id, practice.id)
            if user_progress is not None:
                is_complete = user_progress.is_complete
                attempts = user_progress.attempts or 0
                avg_score = user_progress.avg_score or 0.0

        return WdChapterPracticeSession(
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

    def record_session_result(
        self,
        *,
        user_id: uuid.UUID,
        chapter_id: int,
        avg_score: float,
        is_complete: bool,
    ) -> ChapterPracticeResultData | None:
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
