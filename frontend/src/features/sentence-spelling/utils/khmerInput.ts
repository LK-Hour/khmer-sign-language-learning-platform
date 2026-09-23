/** Khmer Unicode block (consonants, vowels, subscripts, native digits ០-៩,
 * native punctuation) plus whitespace — everything else, including Latin
 * letters, ASCII digits 0-9, emoji, and ASCII punctuation/symbols, should be
 * stripped as the user types, in both the learner-facing custom form and the
 * admin sentence form. */
const DISALLOWED_CHARS_PATTERN = /[^ក-៿\s]/g;

export function sanitizeKhmerInput(value: string): string {
  return value.replace(DISALLOWED_CHARS_PATTERN, "");
}
