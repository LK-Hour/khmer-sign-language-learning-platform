import type { FsLesson } from "../types";

/** Unit exercise unlocks once every lesson in the unit is completed. */
export function isUnitExerciseUnlocked(
  lessons: FsLesson[],
  totalLessonCount: number
): boolean {
  if (totalLessonCount <= 0) return false;
  const completed = lessons.filter(
    (lesson) => lesson?.progressStatus === "COMPLETED"
  ).length;
  return completed >= totalLessonCount;
}
