"""MLP inference for finger-spelling practice (keypoints supplied by the frontend)."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from src.core.config import settings
from src.ml.keypoints import HandKeypointFeatures, features_from_payload, parse_feature_payload
from src.ml.predictor import KhmerHandPredictor, PredictionResult, get_predictor


@dataclass(frozen=True)
class HandPredictionResponse:
    features: HandKeypointFeatures
    prediction: PredictionResult
    match_confidence: float


class HandPredictionService:
    @property
    def is_available(self) -> bool:
        return settings.ml_enabled and settings.ml_model_path.is_file()

    def predict_from_features(
        self,
        features: list[float],
        *,
        handedness: str = "Unknown",
        category: str | None = None,
    ) -> HandPredictionResponse:
        keypoint_features = features_from_payload(
            features,
            handedness=handedness,
        )
        vector = parse_feature_payload(features)
        predictor = get_predictor()
        prediction = predictor.predict(vector, category=category)
        return HandPredictionResponse(
            features=keypoint_features,
            prediction=prediction,
            match_confidence=prediction.confidence,
        )

    def get_metadata(self) -> dict[str, int | None]:
        predictor = get_predictor()
        return {
            "output_class_count": predictor.output_dim,
            "label_count": predictor.label_count,
        }


@lru_cache
def get_hand_prediction_service() -> HandPredictionService:
    return HandPredictionService()
