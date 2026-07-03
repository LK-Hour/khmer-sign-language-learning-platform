"""Label-match prediction wrapper for word-detection practice."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from src.ml.label_match_filter import LabelMatchResult, filter_by_label_match
from src.services.word_detection.word_prediction_service import (
    WordPredictionResponse,
    WordPredictionService,
)


@dataclass(frozen=True)
class WordLabelMatchPredictionResponse:
    base: WordPredictionResponse
    label_match: LabelMatchResult


class WordLabelMatchPredictionService:
    def __init__(self) -> None:
        self._base_service = WordPredictionService()

    @property
    def is_available(self) -> bool:
        return self._base_service.is_available

    @property
    def unavailable_reason(self) -> str | None:
        return self._base_service.unavailable_reason

    def get_metadata(self) -> dict[str, int | None]:
        return self._base_service.get_metadata()

    def predict_from_features_with_target(
        self,
        features: list[float],
        *,
        target_label: str | None,
    ) -> WordLabelMatchPredictionResponse:
        base = self._base_service.predict_from_features(features)
        return WordLabelMatchPredictionResponse(
            base=base,
            label_match=filter_by_label_match(
                base.prediction.predicted_label,
                target_label,
            ),
        )


@lru_cache
def get_word_label_match_prediction_service() -> WordLabelMatchPredictionService:
    return WordLabelMatchPredictionService()
