"""Helpers for opt-in target-label prediction matching."""

from __future__ import annotations

from dataclasses import dataclass

from src.ml.letter_handshape_aliases import ALIAS_TO_CANONICAL_LABEL

NO_ACTION_LABELS = {"no_action", "no action", "none"}

# Letters that are visually/gesturally indistinguishable by the hand-keypoint
# model, so the model can only ever output one canonical label for the group.
# Maps a non-canonical label to the canonical label the model actually
# predicts, so lessons/exercises targeting the non-canonical letter still
# accept the model's prediction as a match. Sourced from
# ``letter_handshape_aliases`` so this stays in sync with the category-mask
# alias handling in ``predictor.py``.
LETTER_MATCH_ALIASES: dict[str, str] = ALIAS_TO_CANONICAL_LABEL


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


def _resolve_match_alias(label: str | None) -> str | None:
    """Map a normalized label to the canonical label used for comparison.

    Only used for the match check, never for the value shown back to the
    caller, so the UI still displays the letter the lesson actually asked
    for (e.g. "ឣ") rather than the model's canonical class (e.g. "អ").
    """
    if label is None:
        return None
    return LETTER_MATCH_ALIASES.get(label, label)


def filter_by_label_match(
    predicted_label: str | None,
    target_label: str | None,
) -> LabelMatchResult:
    normalized_prediction = normalize_label_for_match(predicted_label)
    normalized_target = normalize_label_for_match(target_label)
    comparable_prediction = _resolve_match_alias(normalized_prediction)
    comparable_target = _resolve_match_alias(normalized_target)
    return LabelMatchResult(
        target_label=normalized_target,
        predicted_label=normalized_prediction,
        label_matches=(
            comparable_prediction is not None
            and comparable_target is not None
            and comparable_prediction == comparable_target
        ),
    )
