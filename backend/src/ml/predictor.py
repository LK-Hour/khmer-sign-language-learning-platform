"""Load Keras ``.h5`` MLP weights and run inference with NumPy only (no TensorFlow)."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import h5py
import numpy as np

from src.core.config import settings

MAIN_CONSONANT_LABELS = [
    "ក", "ខ", "គ", "ឃ", "ង", "ច", "ឆ", "ជ", "ឈ", "ញ", "ដ", "ឋ", "ឌ", "ឍ", "ណ", "ត",
    "ថ", "ទ", "ធ", "ន", "ប", "ផ", "ព", "ភ", "ម", "យ", "រ", "ល", "វ", "ស", "ហ", "ឡ",
    "អ",
]
SUB_CONSONANT_LABELS = [
    "្ក", "្ខ", "្គ", "្ឃ", "្ង", "្ច", "្ឆ", "្ជ", "្ឈ", "្ញ", "្ដ", "្ឋ", "្ឌ", "្ឍ",
    "្ណ", "្ត", "្ថ", "្ទ", "្ធ", "្ន", "្ប", "្ផ", "្ព", "្ភ", "្ម", "្យ", "្រ", "្ល",
    "្វ", "្ស", "្ហ", "្អ",
]
DEPENDENT_VOWEL_LABELS = [
    "ា", "ិ", "ី", "ឹ", "ឺ", "ុ", "ូ", "ួ", "ើ", "ឿ", "ៀ", "េ", "ែ", "ៃ", "ោ", "ៅ",
    "ុំ", "ំ", "ាំ", "ះ", "ុះ", "េះ", "ោះ",
]
INDEPENDENT_VOWEL_LABELS = [
    "អា", "ឥ", "ឦ", "ឧ", "ឩ", "ឪ", "ឫ", "ឬ", "ឭ", "ឮ", "ឯ", "ឰ", "ឱ", "ឳ",
]
DIACRITIC_LABELS = [
    "!", "question", "៉", "៊", "៌", "៍", "៎", "៏", "័", "។", "។ល។", "៖", "ៗ", "៚",
]
NUMBER_LABELS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"]

LABEL_CATEGORIES: dict[str, str] = {
    **dict.fromkeys(MAIN_CONSONANT_LABELS, "Main Consonants"),
    **dict.fromkeys(SUB_CONSONANT_LABELS, "Sub Consonants"),
    **dict.fromkeys(DEPENDENT_VOWEL_LABELS, "Dependent Vowels"),
    **dict.fromkeys(INDEPENDENT_VOWEL_LABELS, "Independent Vowels"),
    **dict.fromkeys(DIACRITIC_LABELS, "Diacritics"),
    **dict.fromkeys(NUMBER_LABELS, "Numbers"),
    "No_Action": "None",
}

CATEGORY_ALIASES: dict[str, set[str]] = {
    "Consonant": {"Main Consonants", "Sub Consonants"},
    "Vowel": {"Dependent Vowels", "Independent Vowels"},
}


@dataclass(frozen=True)
class PredictionResult:
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


class KhmerLabelDecoder:
    """Decode model class indices with the exported Khmer ``LabelEncoder`` classes."""

    _ITEM_SIZE = 36  # joblib stored dtype '<U9' => 9 unicode codepoints * 4 bytes

    def __init__(self, encoder_path: Path) -> None:
        self._encoder_path = encoder_path
        self._classes: list[str] | None = None

    @property
    def classes(self) -> list[str]:
        self._ensure_loaded()
        return self._classes or []

    @property
    def class_count(self) -> int:
        return len(self.classes)

    def decode(self, class_index: int, *, expected_count: int | None = None) -> str | None:
        classes = self.classes
        if expected_count is not None and len(classes) != expected_count:
            return None
        if 0 <= class_index < len(classes):
            return self._sign(classes[class_index])
        return None

    @staticmethod
    def _sign(label: str) -> str:
        return label.split(",", 1)[0].strip().replace("_", " ")

    def label_category_map(self) -> dict[str, str]:
        """Return a mapping of display label → category from the encoder labels.

        Older exported encoders only contain the raw label. Newer encoders may
        store ``"Label,Category"``; both shapes are accepted here.
        """
        mapping: dict[str, str] = {}
        for raw in self.classes:
            parts = raw.split(",", 1)
            label = parts[0].strip()
            display = label.replace("_", " ")
            category = (
                parts[1].strip()
                if len(parts) > 1
                else LABEL_CATEGORIES.get(label, "")
            )
            mapping[display] = category
        return mapping

    def _ensure_loaded(self) -> None:
        if self._classes is not None:
            return
        if not self._encoder_path.is_file():
            self._classes = []
            return

        self._classes = self._load_with_joblib() or self._load_embedded_unicode_array()

    def _load_with_joblib(self) -> list[str] | None:
        try:
            import joblib  # type: ignore[import-not-found]
        except ModuleNotFoundError:
            return None

        encoder: Any = joblib.load(self._encoder_path)
        classes = getattr(encoder, "classes_", None)
        if classes is None:
            return []
        return [str(label) for label in classes]

    def _load_embedded_unicode_array(self) -> list[str]:
        data = self._encoder_path.read_bytes()
        start = data.find("No_Action".encode("utf-32-le"))
        if start < 0:
            return []

        labels: list[str] = []
        for offset in range(start, len(data) - self._ITEM_SIZE + 1, self._ITEM_SIZE):
            raw = data[offset : offset + self._ITEM_SIZE]
            label = raw.decode("utf-32-le", errors="ignore").rstrip("\x00")
            if label:
                labels.append(label)
        return labels


class KhmerHandPredictor:
    """NumPy forward pass for Khmer MLP ``.h5`` models."""

    INPUT_DIM = 126
    CLASS_INDEX_OFFSET = 1

    def __init__(self, model_path: Path) -> None:
        self._model_path = model_path
        self._label_decoder = KhmerLabelDecoder(settings.ml_label_encoder_path)
        self._dense_blocks: list[_DenseBlock] = []
        self._output_kernel: np.ndarray | None = None
        self._output_bias: np.ndarray | None = None

    def _ensure_loaded(self) -> None:
        if self._dense_blocks:
            return
        if not self._model_path.is_file():
            raise FileNotFoundError(f"ML model not found: {self._model_path}")

        with h5py.File(self._model_path, "r") as file:
            block_index = 1
            while f"model_weights/dense_{block_index}" in file:
                self._dense_blocks.append(
                    _load_block(file, f"dense_{block_index}", f"bn_{block_index}")
                )
                block_index += 1

            if not self._dense_blocks:
                raise ValueError(f"No dense blocks found in ML model: {self._model_path}")

            self._output_kernel, self._output_bias = _load_output_layer(file)

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
        return self._label_decoder.class_count

    @property
    def label_decoder(self) -> KhmerLabelDecoder:
        return self._label_decoder

    def _forward_block(self, x: np.ndarray, block: _DenseBlock) -> np.ndarray:
        x = x @ block.kernel + block.bias
        x = np.maximum(x, 0.0)  # ReLU
        x = _batch_norm(x, block.bn_gamma, block.bn_beta, block.bn_mean, block.bn_var)
        return x

    def predict(
        self,
        features: list[float] | np.ndarray,
        *,
        category: str | None = None,
    ) -> PredictionResult:
        """Run inference and optionally restrict the result to a label category.

        When *category* is provided, the output probabilities are masked to only
        include labels whose category matches (plus the ``None`` category which
        always represents "No Action").  Remaining probabilities are re‑normalised
        so confidence stays intuitive.
        """
        self._ensure_loaded()
        assert (
            self._dense_blocks
            and self._output_kernel is not None
            and self._output_bias is not None
        )

        vector = np.asarray(features, dtype=np.float32).reshape(-1)
        if vector.shape[0] != self.INPUT_DIM:
            raise ValueError(
                f"Expected {self.INPUT_DIM} features, got {vector.shape[0]}"
            )

        x = vector
        for block in self._dense_blocks:
            x = self._forward_block(x, block)
        logits = x @ self._output_kernel + self._output_bias
        probabilities = _softmax(logits)
        raw_predicted_index = int(np.argmax(probabilities))
        predicted_index = max(0, raw_predicted_index - self.CLASS_INDEX_OFFSET)
        confidence = float(probabilities[raw_predicted_index]) * 100.0

        if category is not None and category.lower() == "none":
            return PredictionResult(
                predicted_class_index=0,
                predicted_label="No Action",
                confidence=0.0,
                probabilities=[float(p) for p in probabilities],
            )

        if category is not None:
            probabilities = self._mask_by_category(probabilities, category)
            raw_predicted_index = int(np.argmax(probabilities))
            predicted_index = max(0, raw_predicted_index - self.CLASS_INDEX_OFFSET)
            confidence = float(probabilities[raw_predicted_index]) * 100.0

        return PredictionResult(
            predicted_class_index=predicted_index,
            predicted_label=self._label_decoder.decode(
                predicted_index,
                expected_count=int(probabilities.shape[0]),
            ),
            confidence=confidence,
            probabilities=[float(p) for p in probabilities],
        )

    def _mask_by_category(
        self,
        probabilities: np.ndarray,
        category: str,
    ) -> np.ndarray:
        """Zero out probabilities for labels not in *category* and re‑normalise.

        The ``None`` / ``No Action`` category is always kept so the model can
        express "nothing detected".
        """
        allowed_categories = CATEGORY_ALIASES.get(category, {category})
        label_category_map = self._label_decoder.label_category_map()
        masked = np.zeros_like(probabilities)
        for i, (display_label, label_category) in enumerate(label_category_map.items()):
            output_idx = i + self.CLASS_INDEX_OFFSET
            if 0 <= output_idx < len(probabilities):
                if (
                    label_category in allowed_categories
                    or label_category == "None"
                    or display_label == "No Action"
                ):
                    masked[output_idx] = probabilities[output_idx]

        total = np.sum(masked)
        if total > 0:
            masked = masked / total
        return masked


@lru_cache
def get_predictor() -> KhmerHandPredictor:
    return KhmerHandPredictor(settings.ml_model_path)
