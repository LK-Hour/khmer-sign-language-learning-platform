"""Recording and reading sentence-spelling practice attempts."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from src.models.sentence_spelling import SentenceSpellingPracticeAttempt, SentenceSpellingSource
from src.repositories.sentence_spelling import SentencePracticeRepository
from src.services.sentence_spelling.sentence_spelling_service import SentenceSpellingService


class SentencePracticeService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = SentencePracticeRepository(db)
        self.sentences = SentenceSpellingService(db)

    def record_attempt(
        self,
        *,
        user_id: uuid.UUID,
        source: SentenceSpellingSource,
        sentence_id: int | None,
        practiced_text: str,
        character_count: int,
        accuracy_percent: float,
    ) -> SentenceSpellingPracticeAttempt | None:
        resolved_sentence_id = None
        if source == SentenceSpellingSource.SAMPLE:
            if sentence_id is None:
                return None
            sentence = self.sentences.get_active_sentence(sentence_id)
            if sentence is None:
                return None
            resolved_sentence_id = sentence.id

        attempt = self.repository.create_attempt(
            user_id=user_id,
            source=source,
            sentence_id=resolved_sentence_id,
            practiced_text=practiced_text,
            character_count=character_count,
            accuracy_percent=accuracy_percent,
        )
        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def get_recent_attempt(self, user_id: uuid.UUID) -> SentenceSpellingPracticeAttempt | None:
        return self.repository.get_most_recent_for_user(user_id)

    def list_recent_custom_texts(
        self, user_id: uuid.UUID, *, limit: int = 5
    ) -> list[SentenceSpellingPracticeAttempt]:
        return self.repository.list_recent_distinct_texts(
            user_id, source=SentenceSpellingSource.CUSTOM, limit=limit
        )
