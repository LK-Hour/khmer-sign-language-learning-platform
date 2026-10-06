import type { Locale } from "@/i18n/config";

/**
 * Number/badge formatting shared by the finger-spelling and word-detection
 * tracks (unit, chapter and lesson labels in both locales).
 */

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export function toKhmerNumeral(value: number): string {
  return String(value)
    .split("")
    .map((digit) => KHMER_DIGITS[Number(digit)] ?? digit)
    .join("");
}

/** Two-digit step number, in Khmer numerals for the Khmer locale. */
export function formatOrderIndex(orderIndex: number, locale: Locale): string {
  return locale === "kh"
    ? toKhmerNumeral(orderIndex).padStart(2, "០")
    : String(orderIndex).padStart(2, "0");
}

/** "Chapter 01" / "ជំពូកទី ០១" style badge; also used for units. */
export function formatChapterBadge(
  orderIndex: number,
  locale: Locale,
  chapterLabel: string
): string {
  const num = formatOrderIndex(orderIndex, locale);
  if (locale === "kh") return `${chapterLabel}ទី ${num}`;
  return `${chapterLabel} ${num}`;
}


export function formatLessonLabel(orderIndex: number, locale: Locale): string {
  const num = formatOrderIndex(orderIndex, locale);
  if (locale === "kh") return `មេរៀនទី ${num}`;
  return `Lesson ${num}`;
}
