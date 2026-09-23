"""Sentence-spelling sample sentence routes (learner-facing).

Admin content management lives in ``src.api.routes.admin.sentence_spelling``.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.schemas.sentence_spelling import SentenceResponse
from src.services.sentence_spelling import SentenceSpellingService

router = APIRouter(prefix="/api/sentence_spelling", tags=["sentence-spelling"])


def _to_response(sentence) -> SentenceResponse:
    return SentenceResponse(id=sentence.id, text_kh=sentence.text_kh, text_en=sentence.text_en)


@router.get("/sentences", response_model=list[SentenceResponse])
def list_sentences(db: Session = Depends(get_db)) -> list[SentenceResponse]:
    service = SentenceSpellingService(db)
    return [_to_response(s) for s in service.list_active_sentences()]


@router.get("/sentences/{sentence_id}", response_model=SentenceResponse)
def get_sentence(sentence_id: int, db: Session = Depends(get_db)) -> SentenceResponse:
    service = SentenceSpellingService(db)
    sentence = service.get_active_sentence(sentence_id)
    if sentence is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sentence not found")
    return _to_response(sentence)
