import type { TrackProgressStatus } from "./trackState";

/**
 * Lesson/practice progress helpers shared by the finger-spelling and
 * word-detection tracks. Generic over each feature's lesson/unit shape.
 */

export type LessonDisplayState = "done" | "now" | "lock";

type OrderedLesson = {
  id: number;
  orderIndex: number;
  isLocked?: boolean;
  progressStatus: TrackProgressStatus;
};

type UnitWithLessons<L> = {
  orderIndex: number;
  isLocked?: boolean;
  chapters: Array<{
    orderIndex: number;
    lessons: L[];
  }>;
};

function byOrderIndex(a: { orderIndex: number }, b: { orderIndex: number }) {
  return a?.orderIndex - b?.orderIndex;
}

export function resolvePracticeState(chapter: {
  isPracticeUnlocked?: boolean;
  isPracticeComplete?: boolean;
}): LessonDisplayState {
  if (chapter?.isPracticeComplete) return "done";
  if (chapter?.isPracticeUnlocked) return "now";
  return "lock";
}

export function statusToPercent(status: TrackProgressStatus): number {
  if (status === "COMPLETED") return 100;
  if (status === "IN_PROGRESS") return 50;
  return 0;
}

/** Practice unlocks once every lesson in the chapter is completed. */
export function isChapterPracticeUnlocked(
  lessons: Array<{ progressStatus: TrackProgressStatus }>,
  lessonCount: number
): boolean {
  if (lessonCount <= 0) return false;
  const completed = lessons.filter(
    (lesson) => lesson?.progressStatus === "COMPLETED"
  ).length;
  return completed >= lessonCount;
}

/** Resolve done / now / lock for each lesson in chapter order. */
export function resolveLessonStates(
  lessons: OrderedLesson[],
  isAdmin: boolean = false
): Map<number, LessonDisplayState> {
  const sorted = [...lessons].sort(byOrderIndex);
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
    // Admins bypass locking entirely: every unlocked lesson is reachable,
    // not just the single "current" one in the normal one-at-a-time flow.
    if (isAdmin || !foundCurrent) {
      states.set(lesson?.id, "now");
      foundCurrent = true;
      continue;
    }
    states.set(lesson?.id, "lock");
  }

  return states;
}

/** Next lesson in chapter order, regardless of lock state (for post-complete navigation). */
export function getNextLessonInChapter<L extends { id: number; orderIndex: number }>(
  lessons: L[],
  currentLessonId: number
): L | undefined {
  const sorted = [...lessons].sort(byOrderIndex);
  const currentIndex = sorted.findIndex((lesson) => lesson?.id === currentLessonId);
  if (currentIndex < 0) return undefined;
  return sorted[currentIndex + 1];
}

/** First active lesson across units/chapters-the one marked "now" in track order. */
export function findResumeLesson<L extends OrderedLesson>(
  units: UnitWithLessons<L>[]
): L | undefined {
  const sortedUnits = [...units].sort(byOrderIndex);

  for (const unit of sortedUnits) {
    const sortedChapters = [...unit?.chapters].sort(byOrderIndex);

    for (const chapter of sortedChapters) {
      const states = resolveLessonStates(chapter?.lessons);
      const sortedLessons = [...chapter?.lessons].sort(byOrderIndex);

      for (const lesson of sortedLessons) {
        if (states.get(lesson?.id) === "now") {
          return lesson;
        }
      }
    }
  }

  return undefined;
}

/** Unit that contains the active lesson in top-to-bottom track order. */
export function findCurrentUnit<U extends UnitWithLessons<OrderedLesson>>(
  units: U[]
): U | undefined {
  const sortedUnits = [...units].sort(byOrderIndex);
  const resumeLesson = findResumeLesson(sortedUnits);

  if (resumeLesson) {
    for (const unit of sortedUnits) {
      for (const chapter of unit?.chapters) {
        if (chapter?.lessons.some((lesson) => lesson?.id === resumeLesson?.id)) {
          return unit;
        }
      }
    }
  }

  const unlockedUnit = sortedUnits.find((unit) => unit?.isLocked !== true);
  return unlockedUnit ?? sortedUnits[0];
}
