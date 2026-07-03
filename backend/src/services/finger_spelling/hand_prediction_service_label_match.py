"""Label-match prediction wrapper for finger-spelling practice."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from src.ml.label_match_filter import LabelMatchResult, filter_by_label_match
from src.services.finger_spelling.hand_prediction_service import (
    HandPredictionResponse,
    HandPredictionService,
)


@dataclass(frozen=True)
class HandLabelMatchPredictionResponse:
    base: HandPredictionResponse
    label_match: LabelMatchResult


class HandLabelMatchPredictionService:
    def __init__(self) -> None:
        self._base_service = HandPredictionService()

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
        category: str | None = None,
    ) -> HandLabelMatchPredictionResponse:
        base = self._base_service.predict_from_features(
            features,
            handedness=handedness,
            category=category,
        )
        return HandLabelMatchPredictionResponse(
            base=base,
            label_match=filter_by_label_match(
                base.prediction.predicted_label,
                target_label,
            ),
        )


@lru_cache
def get_hand_label_match_prediction_service() -> HandLabelMatchPredictionService:
    return HandLabelMatchPredictionService()
