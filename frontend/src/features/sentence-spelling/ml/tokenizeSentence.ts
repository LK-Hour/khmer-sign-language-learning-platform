/**
 * Splits Khmer sentence text into the same grapheme-cluster tokens the
 * sentence-spelling ML model was trained on (see `classMapping.json`,
 * mirrored from `backend/ml/models/sentence_spelling/class_mapping.json`).
 *
 * Plain `Array.from(text)` splits by Unicode codepoint, which breaks a
 * coeng (subscript) consonant like "្ក" into "្" + "ក"-two codepoints
 * that are each meaningless on their own in the model's label space (the
 * subscript is one distinct hand sign, "្ក", not "្" followed by "ក").
 * This tokenizer greedily matches the longest known multi-codepoint label
 * first, falling back to a single codepoint for anything else.
 */

import classMapping from "./classMapping.json";

/** Non-glyph pseudo-labels in the model's class space-never appear in sentence text. */
const PSEUDO_LABELS = new Set(["No_Action", "question"]);

/**
 * Multi-codepoint labels the model can recognize as one gesture, but that we
 * still want practiced as their separate parts ("អា" -> "អ" + "ា") rather
 * than one combined sign.
 */
const NEVER_COMBINE_LABELS = new Set(["អា"]);

const MULTI_CODEPOINT_LABELS = new Set(
  Object.keys(classMapping.label_to_index).filter(
    (label) =>
      !PSEUDO_LABELS.has(label) &&
      !NEVER_COMBINE_LABELS.has(label) &&
      Array.from(label).length > 1
  )
);

const MAX_LABEL_LENGTH = Math.max(
  ...Array.from(MULTI_CODEPOINT_LABELS, (label) => Array.from(label).length)
);

export function tokenizeKhmerSentence(text: string): string[] {
  const codepoints = Array.from(text);
  const tokens: string[] = [];

  let i = 0;
  while (i < codepoints.length) {
    let matched = false;
    for (let len = MAX_LABEL_LENGTH; len > 1; len -= 1) {
      const candidate = codepoints.slice(i, i + len).join("");
      if (MULTI_CODEPOINT_LABELS.has(candidate)) {
        tokens.push(candidate);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push(codepoints[i]);
      i += 1;
    }
  }

  return tokens;
}
