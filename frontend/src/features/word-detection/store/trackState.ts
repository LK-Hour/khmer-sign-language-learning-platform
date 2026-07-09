import type { WdTrackUnit } from "./types";

export function resolveInitialUnitId(units: WdTrackUnit[]): number | null {
  return units.find((unit) => !unit?.isLocked)?.id ?? units[0]?.id ?? null;
}

export function mergeUnitsProgress(
  current: WdTrackUnit[],
  incoming: WdTrackUnit[]
): WdTrackUnit[] {
  if (current.length === 0) return incoming;

  const progressByLessonId = new Map<
    number,
    {
      progressStatus: WdTrackUnit["chapters"][0]["lessons"][0]["progressStatus"];
      progressPercent: number;
    }
  >();
  const practiceCompleteByChapterId = new Set<number>();

  for (const unit of current) {
    for (const chapter of unit?.chapters) {
      if (chapter?.isPracticeComplete) {
        practiceCompleteByChapterId.add(chapter?.id);
      }
      for (const lesson of chapter?.lessons) {
        progressByLessonId.set(lesson?.id, {
          progressStatus: lesson?.progressStatus,
          progressPercent: lesson?.progressPercent ?? 0,
        });
      }
    }
  }

  return incoming.map((unit) => ({
    ...unit,
    chapters: unit?.chapters.map((chapter) => ({
      ...chapter,
      isPracticeComplete:
        chapter?.isPracticeComplete === true ||
        practiceCompleteByChapterId.has(chapter?.id),
      lessons: chapter?.lessons.map((lesson) => {
        const stored = progressByLessonId.get(lesson?.id);
        if (!stored) return lesson;

        const storedComplete = stored.progressStatus === "COMPLETED";
        const incomingComplete = lesson?.progressStatus === "COMPLETED";

        if (storedComplete && !incomingComplete) {
          return {
            ...lesson,
            progressStatus: "COMPLETED" as const,
            progressPercent: 100,
          };
        }

        if (
          (stored.progressPercent ?? 0) > (lesson?.progressPercent ?? 0) &&
          !incomingComplete
        ) {
          return {
            ...lesson,
            progressStatus: stored.progressStatus,
            progressPercent: stored.progressPercent,
          };
        }

        return lesson;
      }),
    })),
  }));
}

export function buildInitialChapterExpansion(
  units: WdTrackUnit[]
): Record<number, boolean> {
  const expanded: Record<number, boolean> = {};

  for (const unit of units) {
    const firstChapter = [...unit?.chapters].sort(
      (a, b) => a?.orderIndex - b?.orderIndex
    )[0];
    if (firstChapter && !firstChapter?.isLocked) {
      expanded[firstChapter?.id] = true;
    }
  }

  return expanded;
}
