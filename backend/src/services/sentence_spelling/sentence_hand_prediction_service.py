"""MLP inference for sentence-spelling practice (keypoints supplied by the frontend)."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from src.core.config import settings
from src.ml.keypoints import HandKeypointFeatures, features_from_payload, parse_feature_payload
from src.ml.sentence_predictor import SentenceHandPredictor, SentencePredictionResult, get_sentence_predictor


@dataclass(frozen=True)
class SentenceHandPredictionResponse:
    features: HandKeypointFeatures
    prediction: SentencePredictionResult
    match_confidence: float


class SentenceHandPredictionService:
    @property
    def is_available(self) -> bool:
        return settings.sentence_ml_enabled and settings.sentence_ml_model_path.is_file()

    def predict_from_features(
        self,
        features: list[float],
        *,
        handedness: str = "Unknown",
    ) -> SentenceHandPredictionResponse:
        keypoint_features = features_from_payload(features, handedness=handedness)
        vector = parse_feature_payload(features)
        predictor: SentenceHandPredictor = get_sentence_predictor()
        prediction = predictor.predict(vector)
        return SentenceHandPredictionResponse(
            features=keypoint_features,
            prediction=prediction,
            match_confidence=prediction.confidence,
        )

    def get_metadata(self) -> dict[str, int | None]:
        predictor = get_sentence_predictor()
        return {
            "output_class_count": predictor.output_dim,
            "label_count": predictor.label_count,
        }


@lru_cache
def get_sentence_hand_prediction_service() -> SentenceHandPredictionService:
    return SentenceHandPredictionService()
