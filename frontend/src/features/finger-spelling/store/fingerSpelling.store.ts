import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  endPracticeSession,
  fetchPracticeAccuracy,
  startPracticeSession,
  submitPracticeLetter,
} from "../api/practiceSession";
import { findResumeLesson } from "../utils/progress";
import {
  FS_MOCK_ACCURACY,
  FS_MOCK_DELAY_MS,
  FS_PASS_THRESHOLD,
  type FsTrackUnit,
  type PracticeContext,
} from "./types";

function resolveInitialUnitId(units: FsTrackUnit[]): number | null {
  return units.find((unit) => !unit.isLocked)?.id ?? units[0]?.id ?? null;
}

function mergeUnitsProgress(
  current: FsTrackUnit[],
  incoming: FsTrackUnit[]
): FsTrackUnit[] {
  if (current.length === 0) return incoming;

  const progressByLessonId = new Map<
    number,
    { progressStatus: FsTrackUnit["chapters"][0]["lessons"][0]["progressStatus"]; progressPercent: number }
  >();

  for (const unit of current) {
    for (const chapter of unit.chapters) {
      for (const lesson of chapter.lessons) {
        progressByLessonId.set(lesson.id, {
          progressStatus: lesson.progressStatus,
          progressPercent: lesson.progressPercent ?? 0,
        });
      }
    }
  }

  return incoming.map((unit) => ({
    ...unit,
    chapters: unit.chapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => {
        const stored = progressByLessonId.get(lesson.id);
        if (!stored) return lesson;

        const storedComplete = stored.progressStatus === "COMPLETED";
        const incomingComplete = lesson.progressStatus === "COMPLETED";

        if (storedComplete && !incomingComplete) {
          return {
            ...lesson,
            progressStatus: "COMPLETED" as const,
            progressPercent: 100,
          };
        }

        if (
          (stored.progressPercent ?? 0) > (lesson.progressPercent ?? 0) &&
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

function buildInitialChapterExpansion(
  units: FsTrackUnit[]
): Record<number, boolean> {
  const expanded: Record<number, boolean> = {};

  for (const unit of units) {
    const firstChapter = [...unit.chapters].sort(
      (a, b) => a.orderIndex - b.orderIndex
    )[0];
    if (firstChapter) {
      expanded[firstChapter.id] = true;
    }
  }

  return expanded;
}

interface FingerSpellingState {
  units: FsTrackUnit[];
  expandedUnitId: number | null;
  expandedChapterIds: Record<number, boolean>;

  practiceContext: PracticeContext | null;
  sessionId: number | null;
  accuracy: number | null;
  cameraResetKey: number;
  isSubmitting: boolean;

  setUnits: (units: FsTrackUnit[]) => void;
  toggleUnitExpanded: (unitId: number) => void;
  toggleChapterExpanded: (chapterId: number) => void;
  isChapterExpanded: (chapterId: number) => boolean;

  setPracticeContext: (context: PracticeContext) => void;
  clearPracticeContext: () => void;
  resetPracticeSession: () => void;
  incrementCameraResetKey: () => void;

  initializePracticeSession: (lessonId: number) => Promise<void>;
  runPracticeRec: (lessonId: number) => Promise<void>;
  completePractice: () => Promise<void>;
  markLessonCompleted: (lessonId: number) => void;
}

export const useFingerSpellingStore = create<FingerSpellingState>()(
  persist(
    (set, get) => ({
      units: [],
      expandedUnitId: null,
      expandedChapterIds: {},

      practiceContext: null,
      sessionId: null,
      accuracy: null,
      cameraResetKey: 0,
      isSubmitting: false,

      setUnits: (units) =>
        set((state) => {
          const mergedUnits = mergeUnitsProgress(state.units, units);
          const expandedUnitId =
            state.expandedUnitId != null &&
            mergedUnits.some((unit) => unit.id === state.expandedUnitId)
              ? state.expandedUnitId
              : resolveInitialUnitId(mergedUnits);

          const hasExpandedChapters =
            Object.keys(state.expandedChapterIds).length > 0;

          return {
            units: mergedUnits,
            expandedUnitId,
            expandedChapterIds: hasExpandedChapters
              ? state.expandedChapterIds
              : buildInitialChapterExpansion(mergedUnits),
          };
        }),

      toggleUnitExpanded: (unitId) =>
        set((state) => ({
          expandedUnitId: state.expandedUnitId === unitId ? null : unitId,
        })),

      toggleChapterExpanded: (chapterId) =>
        set((state) => ({
          expandedChapterIds: {
            ...state.expandedChapterIds,
            [chapterId]: !state.expandedChapterIds[chapterId],
          },
        })),

      isChapterExpanded: (chapterId) =>
        get().expandedChapterIds[chapterId] === true,

      setPracticeContext: (context) =>
        set({
          practiceContext: context,
          sessionId: null,
          accuracy: null,
          isSubmitting: false,
        }),

      clearPracticeContext: () =>
        set({
          practiceContext: null,
          sessionId: null,
          accuracy: null,
          isSubmitting: false,
        }),

      resetPracticeSession: () =>
        set({
          sessionId: null,
          accuracy: null,
          isSubmitting: false,
        }),

      incrementCameraResetKey: () =>
        set((state) => ({ cameraResetKey: state.cameraResetKey + 1 })),

      initializePracticeSession: async (lessonId) => {
        try {
          const session = await startPracticeSession(lessonId);
          set({ sessionId: session.id });
        } catch {
          set({ sessionId: null });
        }
      },

      runPracticeRec: async (lessonId) => {
        set({ isSubmitting: true, accuracy: null });

        const sessionId = get().sessionId;
        if (sessionId == null) {
          window.setTimeout(() => {
            set({ accuracy: FS_MOCK_ACCURACY, isSubmitting: false });
          }, FS_MOCK_DELAY_MS);
          return;
        }

        try {
          await submitPracticeLetter(sessionId, {
            letter_id: lessonId,
            attempts: 1,
          });
          const result = await fetchPracticeAccuracy(sessionId);
          const score = Math.round(
            result.average_accuracy ?? result.peak_accuracy ?? 0
          );
          set({
            accuracy: score > 0 ? score : FS_MOCK_ACCURACY,
            isSubmitting: false,
          });
        } catch {
          window.setTimeout(() => {
            set({ accuracy: FS_MOCK_ACCURACY, isSubmitting: false });
          }, FS_MOCK_DELAY_MS);
        }
      },

      completePractice: async () => {
        const { sessionId, accuracy, practiceContext } = get();
        const lessonId = practiceContext?.lesson.id;

        if (
          sessionId != null &&
          accuracy != null &&
          accuracy >= FS_PASS_THRESHOLD &&
          lessonId != null
        ) {
          try {
            await endPracticeSession(sessionId);
            get().markLessonCompleted(lessonId);
          } catch {
            // Continue even if sync fails.
          }
        }
      },

      markLessonCompleted: (lessonId) =>
        set((state) => ({
          units: state.units.map((unit) => {
            let unitCompletedDelta = 0;

            const chapters = unit.chapters.map((chapter) => {
              let chapterCompletedDelta = 0;

              const lessons = chapter.lessons.map((lesson) => {
                if (lesson.id !== lessonId) return lesson;
                if (lesson.progressStatus === "COMPLETED") return lesson;

                chapterCompletedDelta += 1;
                unitCompletedDelta += 1;

                return {
                  ...lesson,
                  progressStatus: "COMPLETED" as const,
                  progressPercent: 100,
                };
              });

              if (chapterCompletedDelta === 0) {
                return chapter;
              }

              return {
                ...chapter,
                lessons,
                completedLessonCount:
                  chapter.completedLessonCount + chapterCompletedDelta,
              };
            });

            if (unitCompletedDelta === 0) {
              return unit;
            }

            return {
              ...unit,
              chapters,
              completedLessonCount:
                unit.completedLessonCount + unitCompletedDelta,
            };
          }),
        })),
    }),
    {
      name: "finger-spelling-ui",
      partialize: (state) => ({
        expandedUnitId: state.expandedUnitId,
        expandedChapterIds: state.expandedChapterIds,
      }),
    }
  )
);

export function selectResumeLesson(state: FingerSpellingState) {
  return findResumeLesson(state.units);
}

export function selectCurrentUnit(state: FingerSpellingState) {
  const { units, expandedUnitId } = state;
  return (
    units.find((unit) => unit.id === expandedUnitId) ??
    units.find((unit) => !unit.isLocked) ??
    units[0]
  );
}

export { FS_PASS_THRESHOLD };
