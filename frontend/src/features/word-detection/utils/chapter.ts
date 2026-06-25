import type { Locale } from "@/i18n/config";

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export function toKhmerNumeral(value: number): string {
  return String(value)
    .split("")
    .map((digit) => KHMER_DIGITS[Number(digit)] ?? digit)
    .join("");
}

export function formatOrderIndex(orderIndex: number, locale: Locale): string {
  return locale === "kh"
    ? toKhmerNumeral(orderIndex).padStart(2, "០")
    : String(orderIndex).padStart(2, "0");
}

export function formatBadgeStep(orderIndex: number, locale: Locale): string {
  return formatOrderIndex(orderIndex, locale);
}

export function formatChapterBadge(
  orderIndex: number,
  locale: Locale,
  chapterLabel: string
): string {
  const num = formatOrderIndex(orderIndex, locale);
  if (locale === "kh") return `${chapterLabel}ទី ${num}`;
  return `${chapterLabel} ${num}`;
}

export function formatUnitBadge(
  orderIndex: number,
  locale: Locale,
  unitLabel: string
): string {
  return formatChapterBadge(orderIndex, locale, unitLabel);
}

export function formatLessonLabel(orderIndex: number, locale: Locale): string {
  const num = formatOrderIndex(orderIndex, locale);
  if (locale === "kh") return `មេរៀនទី ${num}`;
  return `Lesson ${num}`;
}
