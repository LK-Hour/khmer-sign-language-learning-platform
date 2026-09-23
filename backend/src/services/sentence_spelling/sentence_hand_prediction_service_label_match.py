"""Label-match prediction wrapper for sentence-spelling practice."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from src.ml.sentence_label_match import SentenceLabelMatchResult, filter_by_sentence_label_match
from src.services.sentence_spelling.sentence_hand_prediction_service import (
    SentenceHandPredictionResponse,
    SentenceHandPredictionService,
)


@dataclass(frozen=True)
class SentenceHandLabelMatchPredictionResponse:
    base: SentenceHandPredictionResponse
    label_match: SentenceLabelMatchResult


class SentenceHandLabelMatchPredictionService:
    def __init__(self) -> None:
        self._base_service = SentenceHandPredictionService()

    @property
    def is_available(self) -> bool:
        return self._base_service.is_available

    def get_metadata(self) -> dict[str, int | None]:
        return self._base_service.get_metadata()

    def predict_from_features_with_target(
        self,
        features: list[float],
        *,
        target_label: str | None,
        handedness: str = "Unknown",
    ) -> SentenceHandLabelMatchPredictionResponse:
        base = self._base_service.predict_from_features(features, handedness=handedness)
        return SentenceHandLabelMatchPredictionResponse(
            base=base,
            label_match=filter_by_sentence_label_match(
                base.prediction.predicted_label,
                target_label,
            ),
        )


@lru_cache
def get_sentence_hand_label_match_prediction_service() -> SentenceHandLabelMatchPredictionService:
    return SentenceHandLabelMatchPredictionService()
