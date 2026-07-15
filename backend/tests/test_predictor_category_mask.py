from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace

import numpy as np

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from src.ml.predictor import KhmerHandPredictor, KhmerLabelDecoder  # noqa: E402


def test_label_category_map_uses_builtin_categories_for_plain_encoder_labels():
    decoder = KhmerLabelDecoder(Path("unused.pkl"))
    decoder._classes = ["No_Action", "ក", "្ក", "ា", "អា", "០", "question"]

    assert decoder.label_category_map() == {
        "No Action": "None",
        "ក": "Main Consonants",
        "្ក": "Sub Consonants",
        "ា": "Dependent Vowels",
        "អា": "Independent Vowels",
        "០": "Numbers",
        "question": "Diacritics",
    }


def test_mask_by_category_keeps_matching_category_and_no_action():
    predictor = KhmerHandPredictor.__new__(KhmerHandPredictor)
    predictor._label_decoder = SimpleNamespace(
        label_category_map=lambda: {
            "No Action": "None",
            "ក": "Main Consonants",
            "ា": "Dependent Vowels",
            "០": "Numbers",
        }
    )

    masked = predictor._mask_by_category(
        np.array([0.1, 0.2, 0.3, 0.4]),
        "Main Consonants",
    )

    np.testing.assert_allclose(masked, [1 / 3, 2 / 3, 0.0, 0.0])


def test_mask_by_category_accepts_legacy_broad_frontend_category():
    predictor = KhmerHandPredictor.__new__(KhmerHandPredictor)
    predictor._label_decoder = SimpleNamespace(
        label_category_map=lambda: {
            "No Action": "None",
            "ក": "Main Consonants",
            "្ក": "Sub Consonants",
            "ា": "Dependent Vowels",
        }
    )

    masked = predictor._mask_by_category(
        np.array([0.1, 0.2, 0.3, 0.4]),
        "Consonant",
    )

    np.testing.assert_allclose(masked, [1 / 6, 2 / 6, 3 / 6, 0.0])


def test_mask_by_category_keeps_canonical_alias_label_for_alias_category():
    """"អ" is categorized as "Main Consonants" by the encoder, but the ឣ
    lesson (which shares "អ"'s hand shape) requests the "Independent
    Vowels" category. Without the alias, "អ" would be masked out and could
    never be predicted for that lesson."""
    predictor = KhmerHandPredictor.__new__(KhmerHandPredictor)
    predictor._label_decoder = SimpleNamespace(
        label_category_map=lambda: {
            "No Action": "None",
            "ក": "Main Consonants",
            "អ": "Main Consonants",
            "ា": "Dependent Vowels",
        }
    )

    masked = predictor._mask_by_category(
        np.array([0.05, 0.1, 0.2, 0.3, 0.35]),
        "Independent Vowels",
    )

    # index 1 = "No Action" (always kept), index 3 = "អ" (kept via alias)
    np.testing.assert_allclose(masked, [0.0, 0.25, 0.0, 0.75, 0.0])


def test_mask_by_category_alias_label_not_kept_for_unrelated_category():
    """The alias only applies to "Independent Vowels"; an unrelated category
    (e.g. "Numbers") must still mask "អ" out as normal."""
    predictor = KhmerHandPredictor.__new__(KhmerHandPredictor)
    predictor._label_decoder = SimpleNamespace(
        label_category_map=lambda: {
            "No Action": "None",
            "ក": "Main Consonants",
            "អ": "Main Consonants",
            "០": "Numbers",
        }
    )

    masked = predictor._mask_by_category(
        np.array([0.05, 0.1, 0.2, 0.3, 0.35]),
        "Numbers",
    )

    # index 1 = "No Action" (always kept), index 4 = "០" (matches category)
    np.testing.assert_allclose(masked, [0.0, 0.1 / 0.45, 0.0, 0.0, 0.35 / 0.45])
