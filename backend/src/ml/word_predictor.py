"""Keras inference for word-detection sequence models."""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from src.core.config import settings


WORD_SEQUENCE_LENGTH = 30
WORD_FEATURES_PER_FRAME = 252
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
            import tensorflow as tf  # type: ignore[import-not-found]
        except ModuleNotFoundError as exc:
            raise RuntimeError(
                "TensorFlow is required for word prediction because the model "
                "uses recurrent layers and custom TemporalAttention"
            ) from exc

        @tf.keras.utils.register_keras_serializable()
        class TemporalAttention(tf.keras.layers.Layer):  # type: ignore[misc]
            def build(self, input_shape: tuple[int, ...]) -> None:
                feature_dim = int(input_shape[-1])
                self.att_W = self.add_weight(
                    name="att_W",
                    shape=(feature_dim, feature_dim),
                    initializer="glorot_uniform",
                    trainable=True,
                )
                self.att_b = self.add_weight(
                    name="att_b",
                    shape=(feature_dim,),
                    initializer="zeros",
                    trainable=True,
                )
                self.att_u = self.add_weight(
                    name="att_u",
                    shape=(feature_dim,),
                    initializer="glorot_uniform",
                    trainable=True,
                )
                super().build(input_shape)

            def call(self, inputs: Any) -> Any:
                score = tf.tanh(tf.tensordot(inputs, self.att_W, axes=1) + self.att_b)
                score = tf.tensordot(score, self.att_u, axes=1)
                weights = tf.nn.softmax(score, axis=1)
                weights = tf.expand_dims(weights, axis=-1)
                return tf.reduce_sum(inputs * weights, axis=1)

        self._model = tf.keras.models.load_model(
            self._model_path,
            custom_objects={"TemporalAttention": TemporalAttention},
            compile=False,
        )

    def predict(self, features: list[float] | np.ndarray) -> WordPredictionResult:
        self._ensure_loaded()
        assert self._model is not None

        vector = np.asarray(features, dtype=np.float32).reshape(-1)
        if vector.shape[0] != WORD_FEATURE_COUNT:
            raise ValueError(
                f"Expected {WORD_FEATURE_COUNT} word features, got {vector.shape[0]}"
            )

        sequence = vector.reshape(1, WORD_SEQUENCE_LENGTH, WORD_FEATURES_PER_FRAME)
        prediction = self._model(sequence, training=False)
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
