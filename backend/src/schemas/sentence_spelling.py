from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class SentenceResponse(BaseModel):
    id: int
    text_kh: str
    text_en: str | None = None


class PracticeAttemptRequest(BaseModel):
    source: str  # "sample" | "custom"
    sentence_id: int | None = None
    practiced_text: str
    character_count: int
    accuracy_percent: float


class PracticeAttemptResponse(BaseModel):
    id: str
    source: str
    sentence_id: int | None = None
    practiced_text: str
    character_count: int
    accuracy_percent: float
    completed_at: datetime


class RecentPracticeResponse(BaseModel):
    source: str | None = None
    practiced_text: str | None = None
    accuracy_percent: float | None = None
    completed_at: datetime | None = None


class CustomHistoryEntryResponse(BaseModel):
    practiced_text: str
    completed_at: datetime


class HandPredictFeaturesRequest(BaseModel):
    features: list[float]
    handedness: str | None = None
    target_label: str | None = None


class HandPredictResponse(BaseModel):
    match_confidence: float
    predicted_class_index: int
    predicted_label: str | None = None
    handedness: str
    target_label: str | None = None
    label_matches: bool | None = None


class HandPredictStatusResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    available: bool
    model_loaded: bool = False
    label_count: int = 0
    output_class_count: int | None = None
