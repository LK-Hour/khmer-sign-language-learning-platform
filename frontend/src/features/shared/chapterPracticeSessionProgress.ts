export type ChapterPracticeSessionProgress = {
  currentIndex: number;
  scores: number[];
};

type PracticeFeature = "finger-spelling" | "word-detection";

function storageKey(feature: PracticeFeature, chapterId: number) {
  return `${feature}-chapter-practice-progress:${chapterId}`;
}

function isValidProgress(
  value: unknown,
  itemCount: number
): value is ChapterPracticeSessionProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as ChapterPracticeSessionProgress;
  if (
    typeof progress.currentIndex !== "number" ||
    !Number.isInteger(progress.currentIndex) ||
    progress.currentIndex < 0 ||
    progress.currentIndex >= itemCount
  ) {
    return false;
  }
  if (!Array.isArray(progress.scores)) return false;
  if (progress.scores.length !== progress.currentIndex) return false;
  return progress.scores.every(
    (score) => typeof score === "number" && Number.isFinite(score)
  );
}

export function loadChapterPracticeProgress(
  feature: PracticeFeature,
  chapterId: number,
  itemCount: number
): ChapterPracticeSessionProgress | null {
  if (typeof window === "undefined" || itemCount <= 0) return null;

  try {
    const raw = window.localStorage.getItem(storageKey(feature, chapterId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidProgress(parsed, itemCount)) {
      window.localStorage.removeItem(storageKey(feature, chapterId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveChapterPracticeProgress(
  feature: PracticeFeature,
  chapterId: number,
  progress: ChapterPracticeSessionProgress
): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      storageKey(feature, chapterId),
      JSON.stringify(progress)
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function clearChapterPracticeProgress(
  feature: PracticeFeature,
  chapterId: number
): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(storageKey(feature, chapterId));
  } catch {
    // Ignore storage failures.
  }
}
