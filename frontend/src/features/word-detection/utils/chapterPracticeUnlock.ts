import type { WdLesson } from "../types";

/** Practice unlocks once every lesson in the chapter is completed. */
export function isChapterPracticeUnlocked(
  lessons: WdLesson[],
  lessonCount: number
): boolean {
  if (lessonCount <= 0) return false;
  const completed = lessons.filter(
    (lesson) => lesson?.progressStatus === "COMPLETED"
  ).length;
  return completed >= lessonCount;
}
