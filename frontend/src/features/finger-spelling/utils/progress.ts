import type { FsLesson, FsProgressStatus } from "../types";

export type LessonDisplayState = "done" | "now" | "lock";

export function getLessonProgressPercent(lesson: FsLesson): number {
  if (lesson?.progressPercent != null) return lesson?.progressPercent;
  if (lesson?.progressStatus === "COMPLETED") return 100;
  if (lesson?.progressStatus === "IN_PROGRESS") return 50;
  return 0;
}

export function statusToPercent(status: FsProgressStatus): number {
  if (status === "COMPLETED") return 100;
  if (status === "IN_PROGRESS") return 50;
  return 0;
}

/** Resolve DONE / NOW / LOCK for each lesson in chapter order. */
export function resolveLessonStates(
  lessons: FsLesson[]
): Map<number, LessonDisplayState> {
  const sorted = [...lessons].sort((a, b) => a?.orderIndex - b?.orderIndex);
  const states = new Map<number, LessonDisplayState>();
  let foundCurrent = false;

  for (const lesson of sorted) {
    if (lesson?.progressStatus === "COMPLETED") {
      states.set(lesson?.id, "done");
      continue;
    }
    if (lesson?.isLocked) {
      states.set(lesson?.id, "lock");
      continue;
    }
    if (!foundCurrent) {
      states.set(lesson?.id, "now");
      foundCurrent = true;
      continue;
    }
    states.set(lesson?.id, "lock");
  }

  return states;
}

export function isChapterLocked(
  chapterOrderIndex: number,
  completedLessonCount: number
): boolean {
  return completedLessonCount === 0 && chapterOrderIndex > 1;
}

export function isUnitLocked(
  orderIndex: number,
  completedLessonCount: number
): boolean {
  return completedLessonCount === 0 && orderIndex > 1;
}

/** Next lesson in chapter order, regardless of lock state (for post-complete navigation). */
export function getNextLessonInChapter(
  lessons: FsLesson[],
  currentLessonId: number
): FsLesson | undefined {
  const sorted = [...lessons].sort((a, b) => a?.orderIndex - b?.orderIndex);
  const currentIndex = sorted.findIndex((lesson) => lesson?.id === currentLessonId);
  if (currentIndex < 0) return undefined;
  return sorted[currentIndex + 1];
}

type UnitWithLessons = {
  orderIndex: number;
  chapters: Array<{
    orderIndex: number;
    lessons: FsLesson[];
  }>;
};

/** First active lesson across units/chapters — the one marked "now" in track order. */
export function findResumeLesson(
  units: UnitWithLessons[]
): FsLesson | undefined {
  const sortedUnits = [...units].sort((a, b) => a?.orderIndex - b?.orderIndex);

  for (const unit of sortedUnits) {
    const sortedChapters = [...unit?.chapters].sort(
      (a, b) => a?.orderIndex - b?.orderIndex
    );

    for (const chapter of sortedChapters) {
      const states = resolveLessonStates(chapter?.lessons);
      const sortedLessons = [...chapter?.lessons].sort(
        (a, b) => a?.orderIndex - b?.orderIndex
      );

      for (const lesson of sortedLessons) {
        if (states.get(lesson?.id) === "now") {
          return lesson;
        }
      }
    }
  }

  return undefined;
}
