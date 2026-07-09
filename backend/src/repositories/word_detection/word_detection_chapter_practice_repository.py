"""Data access for word detection chapter-level practice sessions."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.media import Media
from src.models.word_detection import (
    WordDetectionPractice,
    WordDetectionPracticeMedia,
    WordDetectionUserPracticeProgress,
)


class WordDetectionChapterPracticeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_practice_by_chapter(self, chapter_id: int) -> WordDetectionPractice | None:
        stmt = select(WordDetectionPractice).where(
            WordDetectionPractice.chapter_id == chapter_id
        )
        return self.db.scalars(stmt).first()

    def get_or_create_practice(
        self, chapter_id: int, lesson_count: int
    ) -> WordDetectionPractice:
        practice = self.get_practice_by_chapter(chapter_id)
        if practice is not None:
            return practice
        practice = WordDetectionPractice(
            chapter_id=chapter_id,
            lesson_count=lesson_count,
            is_active=True,
        )
        self.db.add(practice)
        self.db.flush()
        return practice

    def get_user_progress(
        self, user_id: uuid.UUID, practice_id: int
    ) -> WordDetectionUserPracticeProgress | None:
        stmt = select(WordDetectionUserPracticeProgress).where(
            WordDetectionUserPracticeProgress.user_id == user_id,
            WordDetectionUserPracticeProgress.word_detection_practice_id == practice_id,
        )
        return self.db.scalars(stmt).first()

    def upsert_user_progress(
        self,
        *,
        user_id: uuid.UUID,
        practice_id: int,
        avg_score: float,
        is_complete: bool,
    ) -> WordDetectionUserPracticeProgress:
        progress = self.get_user_progress(user_id, practice_id)
        now = datetime.now()

        if progress is None:
            progress = WordDetectionUserPracticeProgress(
                user_id=user_id,
                word_detection_practice_id=practice_id,
                is_complete=is_complete,
                is_locked=False,
                attempts=1,
                avg_score=avg_score,
                completed_at=now if is_complete else None,
            )
            self.db.add(progress)
        else:
            progress.attempts = (progress.attempts or 0) + 1
            progress.avg_score = avg_score
            if is_complete and not progress.is_complete:
                progress.is_complete = True
                progress.completed_at = now
            progress.updated_at = now

        self.db.flush()
        return progress

    def list_practice_medias(self, practice_id: int) -> list[Media]:
        stmt = (
            select(Media)
            .join(
                WordDetectionPracticeMedia,
                WordDetectionPracticeMedia.media_id == Media.id,
            )
            .where(WordDetectionPracticeMedia.practice_id == practice_id)
            .order_by(WordDetectionPracticeMedia.id)
        )
        return list(self.db.scalars(stmt).all())

    def is_practice_complete(self, user_id: uuid.UUID, chapter_id: int) -> bool:
        practice = self.get_practice_by_chapter(chapter_id)
        if practice is None:
            return False
        progress = self.get_user_progress(user_id, practice.id)
        return progress is not None and progress.is_complete
