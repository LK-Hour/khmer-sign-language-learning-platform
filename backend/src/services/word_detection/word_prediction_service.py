"""Sequence-model inference for word-detection practice."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from importlib.util import find_spec

from src.core.config import settings
from src.ml.word_predictor import (
    WORD_FEATURE_COUNT,
    WordPredictionResult,
    get_word_predictor,
)


@dataclass(frozen=True)
class WordPredictionResponse:
    prediction: WordPredictionResult
    match_confidence: float


class WordPredictionService:
    @property
    def is_available(self) -> bool:
        return self.unavailable_reason is None

    @property
    def unavailable_reason(self) -> str | None:
        if not settings.word_ml_enabled:
            return "Word prediction is disabled"
        if not settings.word_ml_model_path.is_file():
            return f"Word ML model not found: {settings.word_ml_model_path}"
        if not settings.word_ml_label_map_path.is_file():
            return f"Word label map not found: {settings.word_ml_label_map_path}"
        if find_spec("tensorflow") is None:
            return "TensorFlow is not installed in the backend environment"
        return None

    def predict_from_features(self, features: list[float]) -> WordPredictionResponse:
        if len(features) != WORD_FEATURE_COUNT:
            raise ValueError(f"Expected {WORD_FEATURE_COUNT} word features, got {len(features)}")

        predictor = get_word_predictor()
        prediction = predictor.predict(features)
        return WordPredictionResponse(
            prediction=prediction,
            match_confidence=prediction.confidence,
        )

    def get_metadata(self) -> dict[str, int | None]:
        predictor = get_word_predictor()
        return {
            "input_feature_count": predictor.input_dim,
            "output_class_count": predictor.output_dim,
            "label_count": predictor.label_count,
        }


@lru_cache
def get_word_prediction_service() -> WordPredictionService:
    return WordPredictionService()
