import type { Locale } from "@/i18n/config";
import { getLocalizedPair } from "@/i18n/localizedText";
import type { FsChapter } from "../types";
import type { FsExercise } from "../types/exercise";

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export function toKhmerNumeral(value: number): string {
  return String(value)
    .split("")
    .map((digit) => KHMER_DIGITS[Number(digit)] ?? digit)
    .join("");
}

function normalizeRange(value: string | null | undefined): string {
  return (value ?? "").replace(/\s*[–—]\s*/g, " - ").trim();
}

function stripChapterNumber(title: string, locale: Locale): string {
  let base = title
    .replace(/\s+ទី\s+[\u17E0-\u17E9\d]+$/u, "")
    .replace(/\s+\d+$/u, "")
    .trim();

  if (locale === "en") {
    base = base.replace(/s$/i, "");
  }

  return base;
}

function buildChapterRangeLabel(
  chapter: FsChapter,
  locale: Locale
): string | undefined {
  const rangeRaw =
    locale === "kh"
      ? chapter.descriptionKh ?? chapter.description
      : chapter.description ?? chapter.descriptionKh;

  const range = normalizeRange(rangeRaw);
  if (!range) return undefined;

  if (
    /^(Dependent Vowel|Main Consonant|Sub Consonant|Independent Vowel|Numbers|Diacritics|ស្រៈ|ព្យញ្ជនៈ|ជើង|លេខ|វណ្ណយុត្តិ)/i.test(
      range
    )
  ) {
    return range;
  }

  const title =
    locale === "kh"
      ? chapter.titleKh || chapter.title
      : chapter.title || chapter.titleKh;

  const base = stripChapterNumber(title, locale);
  return `${base} ${range}`;
}

/** e.g. EN "Dependent Vowel ា - ឺ", KH "ស្រៈ ា - ឺ" */
export function getChapterRangeDescriptionPair(
  chapter: FsChapter,
  locale: Locale
) {
  const en = buildChapterRangeLabel(chapter, "en") ?? "";
  const kh = buildChapterRangeLabel(chapter, "kh") ?? en;
  return getLocalizedPair(locale, en, kh);
}

/** @deprecated Use getChapterRangeDescriptionPair */
export function getChapterRangeDescription(
  chapter: FsChapter,
  locale: Locale
): string | undefined {
  return getChapterRangeDescriptionPair(chapter, locale).primary || undefined;
}

export function formatChapterBadge(
  orderIndex: number,
  locale: Locale,
  chapterLabel: string
): string {
  const num =
    locale === "kh"
      ? toKhmerNumeral(orderIndex).padStart(2, "០")
      : String(orderIndex).padStart(2, "0");

  return `${chapterLabel} ${num}`;
}

export function exerciseToChapterSnapshot(exercise: FsExercise): FsChapter {
  return {
    id: exercise.chapterId,
    unitId: exercise.unitId,
    title: exercise.title,
    titleKh: exercise.titleKh,
    description: exercise.chapterDescription ?? null,
    descriptionKh: exercise.chapterDescriptionKh ?? null,
    orderIndex: exercise.chapterOrderIndex,
    lessonCount: 0,
    completedLessonCount: 0,
    isExerciseUnlocked: exercise.isUnlocked,
  };
}

export function getExerciseRangeDescriptionPair(
  exercise: FsExercise,
  locale: Locale
) {
  return getChapterRangeDescriptionPair(
    exerciseToChapterSnapshot(exercise),
    locale
  );
}

export function formatUnitBadge(
  orderIndex: number,
  locale: Locale,
  unitLabel: string
): string {
  return formatChapterBadge(orderIndex, locale, unitLabel);
}
