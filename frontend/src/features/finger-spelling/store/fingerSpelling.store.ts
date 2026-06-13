import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  endPracticeSession,
  startPracticeSession,
  submitPracticeLetter,
} from "../api/practiceSession";
import { predictHandFromFeatures } from "../api/handPredict";
import { findResumeLesson } from "../utils/progress";
import {
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

export type CaptureState =
  | "idle"
  | "waiting_stable"
  | "stable_ready"
  | "capturing"
  | "result";

interface FingerSpellingState {
  units: FsTrackUnit[];
  expandedUnitId: number | null;
  expandedChapterIds: Record<number, boolean>;

  practiceContext: PracticeContext | null;
  sessionId: number | null;
  accuracy: number | null;
  predictedLetter: string | null;
  cameraResetKey: number;
  isSubmitting: boolean;
  captureState: CaptureState;
  stabilityProgress: number;

  setUnits: (units: FsTrackUnit[]) => void;
  toggleUnitExpanded: (unitId: number) => void;
  toggleChapterExpanded: (chapterId: number) => void;
  isChapterExpanded: (chapterId: number) => boolean;

  setPracticeContext: (context: PracticeContext) => void;
  clearPracticeContext: () => void;
  resetPracticeSession: () => void;
  incrementCameraResetKey: () => void;
  setCaptureState: (state: CaptureState) => void;
  setStabilityProgress: (progress: number) => void;

  initializePracticeSession: (lessonId: number) => Promise<void>;
  runPracticeRec: (
    lessonId: number,
    features: number[],
    handedness?: string
  ) => Promise<void>;
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
      predictedLetter: null,
      cameraResetKey: 0,
      isSubmitting: false,
      captureState: "idle",
      stabilityProgress: 0,

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
          predictedLetter: null,
          isSubmitting: false,
          captureState: "idle",
          stabilityProgress: 0,
        }),

      clearPracticeContext: () =>
        set({
          practiceContext: null,
          sessionId: null,
          accuracy: null,
          predictedLetter: null,
          isSubmitting: false,
          captureState: "idle",
          stabilityProgress: 0,
        }),

      resetPracticeSession: () =>
        set({
          sessionId: null,
          accuracy: null,
          predictedLetter: null,
          isSubmitting: false,
          captureState: "idle",
          stabilityProgress: 0,
        }),

      setCaptureState: (state) => set({ captureState: state }),

      setStabilityProgress: (progress) => set({ stabilityProgress: progress }),

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

      runPracticeRec: async (lessonId, features, handedness) => {
        set({ isSubmitting: true, accuracy: null, predictedLetter: null, captureState: "capturing" });

        try {
          const prediction = await predictHandFromFeatures(features, handedness);
          const score = Math.round(prediction.match_confidence);
          const predicted =
            prediction.predicted_label ?? String(prediction.predicted_class_index);

          const sessionId = get().sessionId;
          if (sessionId != null) {
            try {
              await submitPracticeLetter(sessionId, {
                letter_id: lessonId,
                accuracy: score,
                attempts: 1,
              });
            } catch {
              // Non-blocking: prediction result still shown in the UI.
            }
          }

          set({
            accuracy: score,
            predictedLetter: predicted,
            isSubmitting: false,
            captureState: "result",
          });
        } catch {
          set({ isSubmitting: false, captureState: "idle" });
          throw new Error("Hand prediction failed");
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
