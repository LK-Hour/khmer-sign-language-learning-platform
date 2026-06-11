"""Load Keras ``.h5`` MLP weights and run inference with NumPy only (no TensorFlow)."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import h5py
import numpy as np

from src.core.config import settings


@dataclass(frozen=True)
class PredictionResult:
    predicted_class_index: int
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


def _load_block(file: h5py.File, layer: str, bn_layer: str) -> _DenseBlock:
    prefix = f"model_weights/{layer}/Deep_MLP_Khmer/{layer}"
    bn_prefix = f"model_weights/{bn_layer}/Deep_MLP_Khmer/{bn_layer}"
    return _DenseBlock(
        kernel=np.array(file[f"{prefix}/kernel"]),
        bias=np.array(file[f"{prefix}/bias"]),
        bn_gamma=np.array(file[f"{bn_prefix}/gamma"]),
        bn_beta=np.array(file[f"{bn_prefix}/beta"]),
        bn_mean=np.array(file[f"{bn_prefix}/moving_mean"]),
        bn_var=np.array(file[f"{bn_prefix}/moving_variance"]),
    )


def _load_output_layer(file: h5py.File) -> tuple[np.ndarray, np.ndarray]:
    prefix = "model_weights/output/Deep_MLP_Khmer/output"
    return np.array(file[f"{prefix}/kernel"]), np.array(file[f"{prefix}/bias"])


class KhmerHandPredictor:
    """NumPy forward pass for ``best_mlp_khmer_model.h5`` (126 → 512 → 256 → 128 → N)."""

    INPUT_DIM = 126

    def __init__(self, model_path: Path) -> None:
        self._model_path = model_path
        self._dense1: _DenseBlock | None = None
        self._dense2: _DenseBlock | None = None
        self._dense3: _DenseBlock | None = None
        self._output_kernel: np.ndarray | None = None
        self._output_bias: np.ndarray | None = None

    def _ensure_loaded(self) -> None:
        if self._dense1 is not None:
            return
        if not self._model_path.is_file():
            raise FileNotFoundError(f"ML model not found: {self._model_path}")

        with h5py.File(self._model_path, "r") as file:
            self._dense1 = _load_block(file, "dense_1", "bn_1")
            self._dense2 = _load_block(file, "dense_2", "bn_2")
            self._dense3 = _load_block(file, "dense_3", "bn_3")
            self._output_kernel, self._output_bias = _load_output_layer(file)

    @property
    def input_dim(self) -> int:
        return self.INPUT_DIM

    def _forward_block(self, x: np.ndarray, block: _DenseBlock) -> np.ndarray:
        x = x @ block.kernel + block.bias
        x = np.maximum(x, 0.0)  # ReLU
        x = _batch_norm(x, block.bn_gamma, block.bn_beta, block.bn_mean, block.bn_var)
        return x

    def predict(self, features: list[float] | np.ndarray) -> PredictionResult:
        self._ensure_loaded()
        assert (
            self._dense1
            and self._dense2
            and self._dense3
            and self._output_kernel is not None
            and self._output_bias is not None
        )

        vector = np.asarray(features, dtype=np.float32).reshape(-1)
        if vector.shape[0] != self.INPUT_DIM:
            raise ValueError(
                f"Expected {self.INPUT_DIM} features, got {vector.shape[0]}"
            )

        x = vector
        x = self._forward_block(x, self._dense1)
        x = self._forward_block(x, self._dense2)
        x = self._forward_block(x, self._dense3)
        logits = x @ self._output_kernel + self._output_bias
        probabilities = _softmax(logits)
        predicted_index = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_index]) * 100.0

        return PredictionResult(
            predicted_class_index=predicted_index,
            confidence=confidence,
            probabilities=[float(p) for p in probabilities],
        )


@lru_cache
def get_predictor() -> KhmerHandPredictor:
    return KhmerHandPredictor(settings.ml_model_path)
