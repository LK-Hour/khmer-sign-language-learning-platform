import type { TranslationKey } from "@/i18n/translations";

export type ElapsedParts = {
  hours: number;
  minutes: number;
  seconds: number;
};

/**
 * Confidence (0–100) for every character in order. A skipped or
 * never-attempted character has no entry and counts as 0.
 */
export function collectCharacterAccuracies(
  confidenceByIndex: ReadonlyMap<number, number>,
  totalCount: number
): number[] {
  return Array.from({ length: Math.max(totalCount, 0) }, (_, index) => confidenceByIndex.get(index) ?? 0);
}

/**
 * Mean confidence (0–100) across every character in the sentence, skipped
 * characters counting as 0-the same value that is submitted to the server,
 * so the on-screen number matches history.
 */
export function computeAverageAccuracy(
  confidenceByIndex: ReadonlyMap<number, number>,
  totalCount: number
): number {
  if (totalCount <= 0) return 0;
  const accuracies = collectCharacterAccuracies(confidenceByIndex, totalCount);
  return accuracies.reduce((sum, accuracy) => sum + accuracy, 0) / totalCount;
}

export function splitElapsed(elapsedMs: number): ElapsedParts {
  const totalSeconds = Math.max(0, Math.round(elapsedMs / 1000));
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/** Average seconds spent per character; every character consumed time, skipped or not. */
export function secondsPerSign(elapsedMs: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return elapsedMs / totalCount / 1000;
}

/** "Skips" only when more than one-0 and 1 both read "Skip". */
export function skipLabelKey(skippedCount: number): TranslationKey {
  return skippedCount > 1
    ? "SENTENCE_SPELLING.PRACTICE.STATS.SKIP_PLURAL"
    : "SENTENCE_SPELLING.PRACTICE.STATS.SKIP_SINGULAR";
}
