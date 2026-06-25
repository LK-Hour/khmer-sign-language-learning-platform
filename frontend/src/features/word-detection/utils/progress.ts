import type { WdLesson, WdProgressStatus } from "../types";

export type LessonDisplayState = "done" | "now" | "lock";

export function statusToPercent(status: WdProgressStatus): number {
  if (status === "COMPLETED") return 100;
  if (status === "IN_PROGRESS") return 50;
  return 0;
}

export function getLessonProgressPercent(lesson: WdLesson): number {
  if (lesson?.progressPercent != null) return lesson?.progressPercent;
  return statusToPercent(lesson?.progressStatus);
}

/** Resolve done / now / lock for each lesson in chapter order. */
export function resolveLessonStates(
  lessons: WdLesson[]
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

type UnitWithLessons = {
  orderIndex: number;
  isLocked?: boolean;
  chapters: Array<{
    orderIndex: number;
    lessons: WdLesson[];
  }>;
};

export function findResumeLesson(
  units: UnitWithLessons[]
): WdLesson | undefined {
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
        if (states.get(lesson?.id) === "now") return lesson;
      }
    }
  }

  return undefined;
}

export function getNextLessonInChapter(
  lessons: WdLesson[],
  currentId: number
): WdLesson | undefined {
  const sorted = [...lessons].sort((a, b) => a?.orderIndex - b?.orderIndex);
  const idx = sorted.findIndex((l) => l?.id === currentId);
  if (idx < 0 || idx >= sorted.length - 1) return undefined;
  return sorted[idx + 1];
}

export function findCurrentUnit(
  units: UnitWithLessons[]
): UnitWithLessons | undefined {
  const sortedUnits = [...units].sort((a, b) => a?.orderIndex - b?.orderIndex);
  const resumeLesson = findResumeLesson(sortedUnits);

  if (resumeLesson) {
    for (const unit of sortedUnits) {
      for (const chapter of unit?.chapters) {
        if (chapter?.lessons.some((l) => l?.id === resumeLesson?.id)) {
          return unit;
        }
      }
    }
  }

  const unlockedUnit = sortedUnits.find((u) => u?.isLocked !== true);
  return unlockedUnit ?? sortedUnits[0];
}
