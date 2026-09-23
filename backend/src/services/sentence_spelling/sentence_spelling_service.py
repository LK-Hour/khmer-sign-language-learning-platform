"""Learner-facing sentence bank (flat curated list, admin-managed)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from src.models.sentence_spelling import SentenceSpellingSentence
from src.repositories.base.base_crud_repository import BaseCrudRepository


class SentenceSpellingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = BaseCrudRepository(db, SentenceSpellingSentence)

    def list_active_sentences(self) -> list[SentenceSpellingSentence]:
        return self.repository.list(
            active_only=True,
            order_by=[SentenceSpellingSentence.id.asc()],
        )

    def get_active_sentence(self, sentence_id: int) -> SentenceSpellingSentence | None:
        sentence = self.repository.get(sentence_id)
        if sentence is None or not sentence.is_active:
            return None
        return sentence
