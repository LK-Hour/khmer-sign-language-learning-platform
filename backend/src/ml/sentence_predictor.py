"""NumPy-only inference for the sentence-spelling character classifier.

The model was exported with Keras 3's native ``.weights.h5`` format, which
stores variables under ``layers/<layer_name>/vars/<index>`` rather than the
legacy ``model_weights/<layer>/<sub_layer>/<layer>/<kernel|bias>`` layout used
by finger-spelling's ``.h5`` model (see ``src/ml/predictor.py``). The two
layouts differ enough that sharing one loader would be forced, so this is a
small, independent port of the same "pure NumPy forward pass" approach.

Architecture (verified against the exported ``config.json`` and numerically
cross-checked against a TensorFlow/Keras reconstruction of the same weights):

    Input(126)
      -> Dense(512) -> BatchNorm -> ReLU
      -> Dense(256) -> BatchNorm -> ReLU
      -> Dense(128) -> BatchNorm -> ReLU
      -> Dense(128, softmax)

``class_mapping.json`` maps model output index directly to the final Khmer
label (``index_to_label``) — no offset correction needed, unlike finger
spelling's legacy sklearn-exported label encoder.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import h5py
import numpy as np

from src.core.config import settings

FEATURE_COUNT = 126


@dataclass(frozen=True)
class SentencePredictionResult:
    predicted_class_index: int
    predicted_label: str | None
    confidence: float
    probabilities: list[float]


@dataclass
class _DenseBlock:
    kernel: np.ndarray
    bias: np.ndarray
    bn_gamma: np.ndarray
    bn_beta: np.ndarray
    bn_mean: np.ndarray
    bn_var: np.ndarray


def _softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    return exp / np.sum(exp)


def _batch_norm(
    x: np.ndarray,
    gamma: np.ndarray,
    beta: np.ndarray,
    mean: np.ndarray,
    var: np.ndarray,
    eps: float = 1e-3,
) -> np.ndarray:
    return (x - mean) / np.sqrt(var + eps) * gamma + beta


class SentenceClassMapping:
    """Direct index -> Khmer label decoder for ``class_mapping.json``."""

    def __init__(self, mapping_path: Path) -> None:
        self._mapping_path = mapping_path
        self._labels: list[str] | None = None

    @property
    def labels(self) -> list[str]:
        self._ensure_loaded()
        return self._labels or []

    @property
    def label_count(self) -> int:
        return len(self.labels)

    def decode(self, class_index: int) -> str | None:
        labels = self.labels
        if 0 <= class_index < len(labels):
            return labels[class_index]
        return None

    def _ensure_loaded(self) -> None:
        if self._labels is not None:
            return
        if not self._mapping_path.is_file():
            self._labels = []
            return

        with self._mapping_path.open("r", encoding="utf-8") as file:
            mapping = json.load(file)
        index_to_label = mapping.get("index_to_label") or {}
        self._labels = [index_to_label[str(i)] for i in range(len(index_to_label))]


class SentenceHandPredictor:
    """NumPy forward pass for the sentence-spelling Keras-3 MLP export."""

    INPUT_DIM = FEATURE_COUNT

    # Sequential layer names as exported for this architecture: each block is
    # Dense -> BatchNorm -> ReLU (Dropout is inference-time no-op, skipped).
    _DENSE_LAYERS = ("dense", "dense_1", "dense_2")
    _BN_LAYERS = ("batch_normalization", "batch_normalization_1", "batch_normalization_2")
    _OUTPUT_LAYER = "dense_3"

    def __init__(self, model_path: Path, class_mapping_path: Path) -> None:
        self._model_path = model_path
        self._label_decoder = SentenceClassMapping(class_mapping_path)
        self._dense_blocks: list[_DenseBlock] = []
        self._output_kernel: np.ndarray | None = None
        self._output_bias: np.ndarray | None = None

    def _ensure_loaded(self) -> None:
        if self._dense_blocks:
            return
        if not self._model_path.is_file():
            raise FileNotFoundError(f"ML model not found: {self._model_path}")

        with h5py.File(self._model_path, "r") as file:
            for dense_name, bn_name in zip(self._DENSE_LAYERS, self._BN_LAYERS):
                dense_vars = file[f"layers/{dense_name}/vars"]
                bn_vars = file[f"layers/{bn_name}/vars"]
                self._dense_blocks.append(
                    _DenseBlock(
                        kernel=np.array(dense_vars["0"]),
                        bias=np.array(dense_vars["1"]),
                        bn_gamma=np.array(bn_vars["0"]),
                        bn_beta=np.array(bn_vars["1"]),
                        bn_mean=np.array(bn_vars["2"]),
                        bn_var=np.array(bn_vars["3"]),
                    )
                )

            output_vars = file[f"layers/{self._OUTPUT_LAYER}/vars"]
            self._output_kernel = np.array(output_vars["0"])
            self._output_bias = np.array(output_vars["1"])

    @property
    def input_dim(self) -> int:
        return self.INPUT_DIM

    @property
    def output_dim(self) -> int | None:
        self._ensure_loaded()
        if self._output_bias is None:
            return None
        return int(self._output_bias.shape[0])

    @property
    def label_count(self) -> int:
        return self._label_decoder.label_count

    def _forward_block(self, x: np.ndarray, block: _DenseBlock) -> np.ndarray:
        x = x @ block.kernel + block.bias
        x = _batch_norm(x, block.bn_gamma, block.bn_beta, block.bn_mean, block.bn_var)
        x = np.maximum(x, 0.0)  # ReLU
        return x

    def predict(self, features: list[float] | np.ndarray) -> SentencePredictionResult:
        self._ensure_loaded()
        assert (
            self._dense_blocks
            and self._output_kernel is not None
            and self._output_bias is not None
        )

        vector = np.asarray(features, dtype=np.float32).reshape(-1)
        if vector.shape[0] != self.INPUT_DIM:
            raise ValueError(f"Expected {self.INPUT_DIM} features, got {vector.shape[0]}")

        x = vector
        for block in self._dense_blocks:
            x = self._forward_block(x, block)
        logits = x @ self._output_kernel + self._output_bias
        probabilities = _softmax(logits)
        predicted_index = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_index]) * 100.0

        return SentencePredictionResult(
            predicted_class_index=predicted_index,
            predicted_label=self._label_decoder.decode(predicted_index),
            confidence=confidence,
            probabilities=[float(p) for p in probabilities],
        )


@lru_cache
def get_sentence_predictor() -> SentenceHandPredictor:
    return SentenceHandPredictor(
        settings.sentence_ml_model_path,
        settings.sentence_ml_class_mapping_path,
    )
