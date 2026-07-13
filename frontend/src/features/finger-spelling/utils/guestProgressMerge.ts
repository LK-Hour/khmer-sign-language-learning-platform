import { useAuthStore } from "@/store/auth.store";
import type { FsTrackUnit } from "../store/types";
import { isChapterPracticeUnlocked } from "./chapterPracticeUnlock";
import { isUnitExerciseUnlocked } from "./unitExerciseUnlock";
import { useGuestProgressStore } from "../store/guestProgress.store";

/** Merge local guest lesson progress into track units (lessons, chapters, unit exercise). */
export function applyGuestProgress(units: FsTrackUnit[]): FsTrackUnit[] {
  const authUser = useAuthStore.getState().user;
  if (!authUser?.is_guest) return units;

  const completedLessons = new Set(
    Object.values(useGuestProgressStore.getState().lessons)
      .filter((lesson) => lesson?.isCompleted)
      .map((lesson) => lesson?.lessonId)
  );
  const completedChapterPractices = new Set(
    useGuestProgressStore.getState().completedChapterPracticeIds
  );
  const orderedLessonIds = units
    .flatMap((unit) =>
      unit?.chapters.flatMap((chapter) =>
        chapter?.lessons.map((lesson) => ({
          id: lesson?.id,
          unitOrder: unit?.orderIndex,
          chapterOrder: chapter?.orderIndex,
          lessonOrder: lesson?.orderIndex,
        }))
      )
    )
    .sort((a, b) =>
      a?.unitOrder - b?.unitOrder ||
      a?.chapterOrder - b?.chapterOrder ||
      a?.lessonOrder - b?.lessonOrder
    );
  const nextLesson = orderedLessonIds.find((lesson) => !completedLessons.has(lesson?.id));
  const unlockedLessons = new Set(completedLessons);
  if (nextLesson) unlockedLessons.add(nextLesson?.id);

  return units.map((unit) => {
    let unitCompleted = 0;
    let hasUnlockedLessonInUnit = false;
    const chapters = unit?.chapters.map((chapter) => {
      let chapterCompleted = 0;
      let hasUnlockedLessonInChapter = false;
      const lessons = chapter?.lessons.map((lesson) => {
        const isCompleted = completedLessons.has(lesson?.id);
        const isUnlocked = unlockedLessons.has(lesson?.id);
        if (isUnlocked) {
          hasUnlockedLessonInChapter = true;
          hasUnlockedLessonInUnit = true;
        }
        if (isCompleted) {
          chapterCompleted += 1;
          unitCompleted += 1;
        }
        return {
          ...lesson,
          isLocked: !isUnlocked,
          progressStatus: isCompleted ? ("COMPLETED" as const) : lesson?.progressStatus,
          progressPercent: isCompleted ? 100 : lesson?.progressPercent,
        };
      });
      const effectiveCompleted = Math.max(chapter?.completedLessonCount, chapterCompleted);
      return {
        ...chapter,
        isLocked: !hasUnlockedLessonInChapter,
        isPracticeUnlocked: isChapterPracticeUnlocked(
          lessons,
          chapter?.lessonCount ?? 0
        ),
        isPracticeComplete:
          chapter?.isPracticeComplete === true ||
          completedChapterPractices.has(chapter?.id),
        lessons,
        completedLessonCount: effectiveCompleted,
      };
    });

    const allLessons = chapters.flatMap((chapter) => chapter.lessons);
    const totalLessonCount = unit?.totalLessonCount ?? allLessons.length;

    return {
      ...unit,
      isLocked: !hasUnlockedLessonInUnit,
      chapters,
      completedLessonCount: Math.max(unit?.completedLessonCount, unitCompleted),
      isExerciseUnlocked: isUnitExerciseUnlocked(allLessons, totalLessonCount),
    };
  });
}
