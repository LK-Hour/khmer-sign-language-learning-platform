/**
 * Shared, feature-agnostic helpers for curriculum "track" state.
 *
 * The finger-spelling and word-detection tracks share the same unit → chapter →
 * lesson progress model, so the merge/initialisation logic lives here and is
 * parameterised over the concrete unit shape of each feature.
 */

export type TrackProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface TrackLessonLike {
  id: number;
  progressStatus: TrackProgressStatus;
  progressPercent?: number;
}

export interface TrackChapterLike<Lesson extends TrackLessonLike> {
  id: number;
  orderIndex: number;
  isLocked?: boolean;
  isPracticeComplete?: boolean;
  lessons: Lesson[];
}

export interface TrackUnitLike<
  Lesson extends TrackLessonLike,
  Chapter extends TrackChapterLike<Lesson>,
> {
  id: number;
  isLocked?: boolean;
  chapters: Chapter[];
}

export function resolveInitialUnitId<Unit extends { id: number; isLocked?: boolean }>(
  units: Unit[]
): number | null {
  return units.find((unit) => !unit?.isLocked)?.id ?? units[0]?.id ?? null;
}

export function mergeUnitsProgress<
  Lesson extends TrackLessonLike,
  Chapter extends TrackChapterLike<Lesson>,
  Unit extends TrackUnitLike<Lesson, Chapter>,
>(current: Unit[], incoming: Unit[]): Unit[] {
  if (current.length === 0) return incoming;

  const progressByLessonId = new Map<
    number,
    { progressStatus: TrackProgressStatus; progressPercent: number }
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
  })) as Unit[];
}

export function buildInitialChapterExpansion<
  Lesson extends TrackLessonLike,
  Chapter extends TrackChapterLike<Lesson>,
  Unit extends TrackUnitLike<Lesson, Chapter>,
>(
  units: Unit[],
  options: { skipLockedFirstChapter?: boolean } = {}
): Record<number, boolean> {
  const { skipLockedFirstChapter = false } = options;
  const expanded: Record<number, boolean> = {};

  for (const unit of units) {
    const firstChapter = [...unit?.chapters].sort(
      (a, b) => a?.orderIndex - b?.orderIndex
    )[0];
    if (firstChapter && (!skipLockedFirstChapter || !firstChapter?.isLocked)) {
      expanded[firstChapter?.id] = true;
    }
  }

  return expanded;
}
