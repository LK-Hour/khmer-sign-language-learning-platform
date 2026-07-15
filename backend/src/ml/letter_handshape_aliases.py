"""Canonical hand-shape aliases for Khmer letters the model can't tell apart.

Some letters in the curriculum are gesturally identical to a differently
labeled/categorized letter, as far as the trained hand-keypoint model is
concerned. The clearest example: the deprecated independent vowel ឣ
(finger_letters id=114) has the exact same hand shape as the main consonant
អ (id=56), so the model's ``LabelEncoder`` only ever learned one canonical
class, "អ", for that shape.

This module is the single source of truth for that relationship. It is
consumed in two places that would otherwise need to agree on the same facts:

1. ``src.ml.predictor.KhmerHandPredictor._mask_by_category`` — when a lesson
   for the *alias* letter (ឣ) requests category-restricted prediction, the
   category sent is the alias letter's own curriculum category
   ("Independent Vowels"), not the canonical label's category
   ("Main Consonants"). Without accounting for the alias here, the
   canonical label would be masked out entirely and could never be
   predicted for that lesson.
2. ``src.ml.label_match_filter.filter_by_label_match`` — the final
   predicted-label vs. target-label string comparison needs to treat the
   canonical prediction ("អ") as a match for a lesson targeting the alias
   letter ("ឣ").
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LetterHandshapeAlias:
    """One alias relationship between a curriculum letter and the model's
    canonical class for its (shared) hand shape."""

    alias_label: str
    """The letter as stored/displayed for the lesson/target (e.g. "ឣ")."""

    canonical_label: str
    """The label the model actually predicts for this hand shape (e.g. "អ")."""

    alias_category: str
    """The curriculum category the alias letter belongs to (e.g.
    "Independent Vowels"), used so category-masked predictions for that
    category don't exclude the canonical label."""


LETTER_HANDSHAPE_ALIASES: tuple[LetterHandshapeAlias, ...] = (
    LetterHandshapeAlias(
        alias_label="ឣ",
        canonical_label="អ",
        alias_category="Independent Vowels",
    ),
)

# alias label -> canonical label the model predicts for that hand shape.
ALIAS_TO_CANONICAL_LABEL: dict[str, str] = {
    alias.alias_label: alias.canonical_label for alias in LETTER_HANDSHAPE_ALIASES
}

# canonical label -> extra categories it must be allowed through for during
# category masking, because some alias letter in that category shares its
# hand shape.
CANONICAL_LABEL_EXTRA_CATEGORIES: dict[str, set[str]] = {}
for _alias in LETTER_HANDSHAPE_ALIASES:
    CANONICAL_LABEL_EXTRA_CATEGORIES.setdefault(_alias.canonical_label, set()).add(
        _alias.alias_category
    )
del _alias
