"""Target-label matching for sentence-spelling practice.

Unlike finger-spelling's ``label_match_filter``, this does not resolve any
visual-ambiguity aliases-the sentence-spelling model is a distinct,
newer classifier and no alias data has been curated for it yet. If specific
handshapes turn out to be ambiguous for this model, add an alias table here
the same way ``letter_handshape_aliases`` does for finger-spelling.
"""

from __future__ import annotations

from dataclasses import dataclass

NO_ACTION_LABELS = {"no_action", "no action", "none"}


@dataclass(frozen=True)
class SentenceLabelMatchResult:
    target_label: str | None
    predicted_label: str | None
    label_matches: bool


def normalize_sentence_label(label: str | None) -> str | None:
    if label is None:
        return None
    normalized = label.strip()
    if not normalized:
        return None
    if normalized.lower() in NO_ACTION_LABELS:
        return "No Action"
    return normalized


def filter_by_sentence_label_match(
    predicted_label: str | None,
    target_label: str | None,
) -> SentenceLabelMatchResult:
    normalized_prediction = normalize_sentence_label(predicted_label)
    normalized_target = normalize_sentence_label(target_label)
    return SentenceLabelMatchResult(
        target_label=normalized_target,
        predicted_label=normalized_prediction,
        label_matches=(
            normalized_prediction is not None
            and normalized_target is not None
            and normalized_prediction == normalized_target
        ),
    )
