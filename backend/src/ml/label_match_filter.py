"""Helpers for opt-in target-label prediction matching."""

from __future__ import annotations

from dataclasses import dataclass


NO_ACTION_LABELS = {"no_action", "no action", "none"}


@dataclass(frozen=True)
class LabelMatchResult:
    target_label: str | None
    predicted_label: str | None
    label_matches: bool


def normalize_label_for_match(label: str | None) -> str | None:
    if label is None:
        return None
    normalized = label.strip().replace("_", " ")
    if not normalized:
        return None
    if normalized.lower() in NO_ACTION_LABELS:
        return "No Action"
    return normalized


def filter_by_label_match(
    predicted_label: str | None,
    target_label: str | None,
) -> LabelMatchResult:
    normalized_prediction = normalize_label_for_match(predicted_label)
    normalized_target = normalize_label_for_match(target_label)
    return LabelMatchResult(
        target_label=normalized_target,
        predicted_label=normalized_prediction,
        label_matches=(
            normalized_prediction is not None
            and normalized_target is not None
            and normalized_prediction == normalized_target
        ),
    )
