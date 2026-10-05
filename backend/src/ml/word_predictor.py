"""Keras 3 inference for the word-detection BiLSTM (landmarks in, feature engineering here)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from src.core.config import settings
from src.ml.word_features import (
    RAW_FEATURES_PER_FRAME as WORD_FEATURES_PER_FRAME,
    SEQUENCE_LENGTH as WORD_SEQUENCE_LENGTH,
    build_model_input,
)

# The browser sends raw landmarks (30 frames x 258); the model's 686 engineered
# features per frame are built server-side in ``word_features``.
WORD_FEATURE_COUNT = WORD_SEQUENCE_LENGTH * WORD_FEATURES_PER_FRAME


@dataclass(frozen=True)
class WordPredictionResult:
    predicted_class_index: int
    predicted_label: str | None
    confidence: float
    probabilities: list[float]


def normalize_word_label(label: str | None) -> str | None:
    if label is None:
        return None
    normalized = label.strip()
    if not normalized:
        return None
    if normalized.lower() in {"no_action", "no action", "none"}:
        return "No Action"
    return normalized


class WordLabelMap:
    def __init__(self, label_map_path: Path) -> None:
        self._label_map_path = label_map_path
        self._index_to_label: dict[int, str] | None = None

    @property
    def labels(self) -> dict[int, str]:
        self._ensure_loaded()
        return self._index_to_label or {}

    @property
    def label_count(self) -> int:
        return len(self.labels)

    def decode(self, class_index: int) -> str | None:
        return normalize_word_label(self.labels.get(class_index))

    def _ensure_loaded(self) -> None:
        if self._index_to_label is not None:
            return
        if not self._label_map_path.is_file():
            self._index_to_label = {}
            return

        raw = json.loads(self._label_map_path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            raise ValueError(f"Invalid word label map: {self._label_map_path}")

        self._index_to_label = {int(index): str(label) for label, index in raw.items()}


class WordDetectionPredictor:
    def __init__(self, model_path: Path, label_map_path: Path) -> None:
        self._model_path = model_path
        self._label_map = WordLabelMap(label_map_path)
        self._model: Any | None = None

    @property
    def input_dim(self) -> int:
        return WORD_FEATURE_COUNT

    @property
    def output_dim(self) -> int | None:
        self._ensure_loaded()
        output_shape = getattr(self._model, "output_shape", None)
        if not output_shape:
            return None
        return int(output_shape[-1])

    @property
    def label_count(self) -> int:
        return self._label_map.label_count

    def _ensure_loaded(self) -> None:
        if self._model is not None:
            return
        if not self._model_path.is_file():
            raise FileNotFoundError(f"Word ML model not found: {self._model_path}")

        try:
            import keras  # type: ignore[import-not-found]
        except ModuleNotFoundError as exc:
            raise RuntimeError("Keras 3 (with TensorFlow) is required for word prediction") from exc

        self._model = keras.models.load_model(self._model_path, compile=False)

    def predict(self, features: list[float] | np.ndarray) -> WordPredictionResult:
        self._ensure_loaded()
        assert self._model is not None

        vector = np.asarray(features, dtype=np.float32).reshape(-1)
        if vector.shape[0] != WORD_FEATURE_COUNT:
            raise ValueError(
                f"Expected {WORD_FEATURE_COUNT} word features, got {vector.shape[0]}"
            )

        sequence = build_model_input(vector.reshape(WORD_SEQUENCE_LENGTH, WORD_FEATURES_PER_FRAME))
        prediction = self._model(sequence[np.newaxis], training=False)
        probabilities = np.asarray(prediction, dtype=np.float32).reshape(-1)
        predicted_index = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_index]) * 100.0

        return WordPredictionResult(
            predicted_class_index=predicted_index,
            predicted_label=self._label_map.decode(predicted_index),
            confidence=confidence,
            probabilities=[float(p) for p in probabilities],
        )


@lru_cache
def get_word_predictor() -> WordDetectionPredictor:
    return WordDetectionPredictor(
        settings.word_ml_model_path,
        settings.word_ml_label_map_path,
    )
