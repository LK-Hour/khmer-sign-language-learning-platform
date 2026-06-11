"""Hand keypoint feature vector helpers (extraction runs in the browser)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, cast

HandednessLabel = Literal["Left", "Right", "Unknown"]

LANDMARKS_PER_HAND = 21
VALUES_PER_HAND = LANDMARKS_PER_HAND * 3
MODEL_INPUT_DIM = 126


@dataclass(frozen=True)
class HandKeypointFeatures:
    """Feature vector aligned with the training notebook."""

    handedness: HandednessLabel
    right_hand: list[float]
    left_hand: list[float]

    @property
    def vector(self) -> list[float]:
        """Flat vector: handedness flag + right (63) + left (63) = 127 values."""
        hand_code = 1.0 if self.handedness == "Right" else 0.0
        return [hand_code, *self.right_hand, *self.left_hand]

    @property
    def vector_without_handedness(self) -> list[float]:
        return [*self.right_hand, *self.left_hand]


def parse_feature_payload(features: list[float]) -> list[float]:
    """Normalize browser payload to 126-dim model input (right + left hands)."""
    if len(features) == MODEL_INPUT_DIM:
        return features
    if len(features) == MODEL_INPUT_DIM + 1:
        return features[1:]
    raise ValueError(
        f"Expected {MODEL_INPUT_DIM} or {MODEL_INPUT_DIM + 1} keypoint values, got {len(features)}"
    )


def features_from_payload(
    features: list[float],
    *,
    handedness: str = "Unknown",
) -> HandKeypointFeatures:
    vector = parse_feature_payload(features)
    label = handedness if handedness in {"Left", "Right", "Unknown"} else "Unknown"
    return HandKeypointFeatures(
        handedness=cast(HandednessLabel, label),
        right_hand=vector[:VALUES_PER_HAND],
        left_hand=vector[VALUES_PER_HAND:],
    )
