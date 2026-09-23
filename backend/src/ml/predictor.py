"""Load the Keras 3 finger-spelling MLP and run inference with NumPy only (no TensorFlow).

The model is exported as a ``.keras`` archive: a zip holding ``model.weights.h5``,
whose variables live under ``layers/<layer_name>/vars/<index>``. A bare
``.weights.h5`` file uses the same layout and is accepted too.

Architecture (from the exported ``config.json``):

    Input(126)
      -> Dense(512) -> BatchNorm -> ReLU
      -> Dense(256) -> BatchNorm -> ReLU
      -> Dense(128) -> BatchNorm -> ReLU
      -> Dense(128, softmax)

Dropout is a no-op at inference and is skipped. ``class_mapping.json`` maps each
output index straight to its label, so there is no index offset to correct for.

The 126 inputs are Right(63) + Left(63) MediaPipe landmarks, wrist-normalized
(one hand) or pair-normalized (two hands) in the browser -- see
``frontend/src/features/finger-spelling/ml/handKeypoints.ts``.
"""

from __future__ import annotations

import io
import json
import zipfile
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import h5py
import numpy as np

from src.core.config import settings
from src.ml.letter_handshape_aliases import CANONICAL_LABEL_EXTRA_CATEGORIES

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
    "!", "question", "៉", "៊", "់", "៌", "៍", "៎", "៏", "័", "។", "។ល។", "៖", "ៗ", "៚",
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

# Layer names as exported for this architecture: each block is
# Dense -> BatchNorm -> ReLU, followed by a softmax output Dense.
_DENSE_LAYERS = ("dense", "dense_1", "dense_2")
_BN_LAYERS = ("batch_normalization", "batch_normalization_1", "batch_normalization_2")
_OUTPUT_LAYER = "dense_3"
_KERAS_WEIGHTS_MEMBER = "model.weights.h5"


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


def _open_weights(model_path: Path) -> h5py.File:
    """Open the weights file, unpacking it from a ``.keras`` archive when needed."""
    if model_path.suffix == ".keras":
        with zipfile.ZipFile(model_path) as archive:
            return h5py.File(io.BytesIO(archive.read(_KERAS_WEIGHTS_MEMBER)), "r")
    return h5py.File(model_path, "r")


def _load_block(file: h5py.File, dense_layer: str, bn_layer: str) -> _DenseBlock:
    dense_vars = file[f"layers/{dense_layer}/vars"]
    bn_vars = file[f"layers/{bn_layer}/vars"]
    return _DenseBlock(
        kernel=np.array(dense_vars["0"]),
        bias=np.array(dense_vars["1"]),
        bn_gamma=np.array(bn_vars["0"]),
        bn_beta=np.array(bn_vars["1"]),
        bn_mean=np.array(bn_vars["2"]),
        bn_var=np.array(bn_vars["3"]),
    )


class KhmerLabelDecoder:
    """Decode model output indices with ``class_mapping.json`` (``index_to_label``)."""

    def __init__(self, mapping_path: Path) -> None:
        self._mapping_path = mapping_path
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
        return label.strip().replace("_", " ")

    def label_category_map(self) -> dict[str, str]:
        """Return a mapping of display label → category, in output-index order."""
        return {
            self._sign(label): LABEL_CATEGORIES.get(label, "")
            for label in self.classes
        }

    def _ensure_loaded(self) -> None:
        if self._classes is not None:
            return
        if not self._mapping_path.is_file():
            self._classes = []
            return

        with self._mapping_path.open("r", encoding="utf-8-sig") as file:
            index_to_label = json.load(file).get("index_to_label") or {}
        self._classes = [index_to_label[str(i)] for i in range(len(index_to_label))]


class KhmerHandPredictor:
    """NumPy forward pass for the Khmer finger-spelling Keras 3 MLP."""

    INPUT_DIM = 126

    def __init__(self, model_path: Path, class_mapping_path: Path) -> None:
        self._model_path = model_path
        self._label_decoder = KhmerLabelDecoder(class_mapping_path)
        self._dense_blocks: list[_DenseBlock] = []
        self._output_kernel: np.ndarray | None = None
        self._output_bias: np.ndarray | None = None

    def _ensure_loaded(self) -> None:
        if self._dense_blocks:
            return
        if not self._model_path.is_file():
            raise FileNotFoundError(f"ML model not found: {self._model_path}")

        with _open_weights(self._model_path) as file:
            blocks = [
                _load_block(file, dense_layer, bn_layer)
                for dense_layer, bn_layer in zip(_DENSE_LAYERS, _BN_LAYERS)
            ]
            output_vars = file[f"layers/{_OUTPUT_LAYER}/vars"]
            self._output_kernel = np.array(output_vars["0"])
            self._output_bias = np.array(output_vars["1"])

        # Assigned last: `_dense_blocks` being non-empty is the "fully loaded" flag.
        self._dense_blocks = blocks

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
        x = _batch_norm(x, block.bn_gamma, block.bn_beta, block.bn_mean, block.bn_var)
        x = np.maximum(x, 0.0)  # ReLU
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

        if category is not None and category.lower() == "none":
            classes = self._label_decoder.classes
            no_action_index = classes.index("No_Action") if "No_Action" in classes else 0
            return PredictionResult(
                predicted_class_index=no_action_index,
                predicted_label="No Action",
                confidence=0.0,
                probabilities=[float(p) for p in probabilities],
            )

        if category is not None:
            probabilities = self._mask_by_category(probabilities, category)

        predicted_index = int(np.argmax(probabilities))
        return PredictionResult(
            predicted_class_index=predicted_index,
            predicted_label=self._label_decoder.decode(
                predicted_index,
                expected_count=int(probabilities.shape[0]),
            ),
            confidence=float(probabilities[predicted_index]) * 100.0,
            probabilities=[float(p) for p in probabilities],
        )

    def _mask_by_category(
        self,
        probabilities: np.ndarray,
        category: str,
    ) -> np.ndarray:
        """Zero out probabilities for labels not in *category* and re‑normalise.

        The ``None`` / ``No Action`` category is always kept so the model can
        express "nothing detected". A label is also kept if it is the
        canonical model class for an alias letter that belongs to
        *category* (see ``letter_handshape_aliases``), so a lesson for that
        alias letter can still receive its canonical prediction even though
        the label's own category (e.g. "Main Consonants") differs from the
        lesson's category (e.g. "Independent Vowels").
        """
        allowed_categories = CATEGORY_ALIASES.get(category, {category})
        label_category_map = self._label_decoder.label_category_map()
        masked = np.zeros_like(probabilities)
        for i, (display_label, label_category) in enumerate(label_category_map.items()):
            if i < len(probabilities):
                extra_categories = CANONICAL_LABEL_EXTRA_CATEGORIES.get(display_label, set())
                if (
                    label_category in allowed_categories
                    or label_category == "None"
                    or display_label == "No Action"
                    or extra_categories & allowed_categories
                ):
                    masked[i] = probabilities[i]

        total = np.sum(masked)
        if total > 0:
            masked = masked / total
        return masked


@lru_cache
def get_predictor() -> KhmerHandPredictor:
    return KhmerHandPredictor(settings.ml_model_path, settings.ml_class_mapping_path)
