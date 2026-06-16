import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  FS_PASS_THRESHOLD,
  type FsTrackUnit,
  type PracticeContext,
} from "./types";
import {
  buildInitialChapterExpansion,
  mergeUnitsProgress,
  resolveInitialUnitId,
} from "./trackState";
import { useAuthStore } from "@/store/auth.store";
import { useGuestProgressStore } from "./guestProgress.store";

export type CaptureState =
  | "idle"
  | "waiting_stable"
  | "stable_ready"
  | "capturing"
  | "result";

export interface FingerSpellingState {
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
  /** Resets the practice result (accuracy, predictedLetter, isSubmitting, captureState) but keeps the sessionId alive for retry. */
  resetPracticeResult: () => void;
  incrementCameraResetKey: () => void;
  setPracticeSessionId: (sessionId: number | null) => void;
  startPracticeSubmission: () => void;
  finishPracticeSubmission: (result: {
    accuracy: number;
    predictedLetter: string;
  }) => void;
  failPracticeSubmission: () => void;
  setCaptureState: (state: CaptureState) => void;
  setStabilityProgress: (progress: number) => void;

  markLessonCompleted: (lessonId: number) => void;
}

function applyGuestProgress(units: FsTrackUnit[]): FsTrackUnit[] {
  const authUser = useAuthStore.getState().user;
  if (!authUser?.is_guest) return units;

  const completedLessons = new Set(
    Object.values(useGuestProgressStore.getState().lessons)
      .filter((lesson) => lesson.isCompleted)
      .map((lesson) => lesson.lessonId)
  );
  const orderedLessonIds = units
    .flatMap((unit) =>
      unit.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => ({
          id: lesson.id,
          unitOrder: unit.orderIndex,
          chapterOrder: chapter.orderIndex,
          lessonOrder: lesson.orderIndex,
        }))
      )
    )
    .sort((a, b) =>
      a.unitOrder - b.unitOrder ||
      a.chapterOrder - b.chapterOrder ||
      a.lessonOrder - b.lessonOrder
    );
  const nextLesson = orderedLessonIds.find((lesson) => !completedLessons.has(lesson.id));
  const unlockedLessons = new Set(completedLessons);
  if (nextLesson) unlockedLessons.add(nextLesson.id);

  return units.map((unit) => {
    let unitCompleted = 0;
    let hasUnlockedLessonInUnit = false;
    const chapters = unit.chapters.map((chapter) => {
      let chapterCompleted = 0;
      let hasUnlockedLessonInChapter = false;
      const lessons = chapter.lessons.map((lesson) => {
        const isCompleted = completedLessons.has(lesson.id);
        const isUnlocked = unlockedLessons.has(lesson.id);
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
          progressStatus: isCompleted ? "COMPLETED" as const : lesson.progressStatus,
          progressPercent: isCompleted ? 100 : lesson.progressPercent,
        };
      });
      return {
        ...chapter,
        isLocked: !hasUnlockedLessonInChapter,
        lessons,
        completedLessonCount: Math.max(chapter.completedLessonCount, chapterCompleted),
      };
    });
    return {
      ...unit,
      isLocked: !hasUnlockedLessonInUnit,
      chapters,
      completedLessonCount: Math.max(unit.completedLessonCount, unitCompleted),
    };
  });
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
          const authUser = useAuthStore.getState().user;
          const incomingUnits = applyGuestProgress(units);
          const mergedUnits = authUser?.is_guest
            ? mergeUnitsProgress(state.units, incomingUnits)
            : incomingUnits;
          const expandedUnitId =
            state.expandedUnitId != null &&
            mergedUnits.some((unit) => unit.id === state.expandedUnitId && unit.isLocked !== true)
              ? state.expandedUnitId
              : resolveInitialUnitId(mergedUnits);

          const hasExpandedChapters =
            Object.keys(state.expandedChapterIds).length > 0;
          const unlockedChapterIds = new Set(
            mergedUnits.flatMap((unit) =>
              unit.isLocked === true
                ? []
                : unit.chapters
                    .filter((chapter) => chapter.isLocked !== true)
                    .map((chapter) => chapter.id)
            )
          );
          const expandedChapterIds = hasExpandedChapters
            ? Object.fromEntries(
                Object.entries(state.expandedChapterIds).filter(
                  ([chapterId]) => unlockedChapterIds.has(Number(chapterId))
                )
              )
            : buildInitialChapterExpansion(mergedUnits);

          return {
            units: mergedUnits,
            expandedUnitId,
            expandedChapterIds,
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

      resetPracticeResult: () =>
        set({
          accuracy: null,
          predictedLetter: null,
          isSubmitting: false,
          captureState: "idle",
          stabilityProgress: 0,
          // NOTE: sessionId is intentionally preserved so that
          // completePractice() can still submit the result to the
          // same backend session.
        }),

      setCaptureState: (state) => set({ captureState: state }),

      setStabilityProgress: (progress) => set({ stabilityProgress: progress }),

      incrementCameraResetKey: () =>
        set((state) => ({ cameraResetKey: state.cameraResetKey + 1 })),

      setPracticeSessionId: (sessionId) => set({ sessionId }),

      startPracticeSubmission: () =>
        set({
          isSubmitting: true,
          accuracy: null,
          predictedLetter: null,
          captureState: "capturing",
        }),

      finishPracticeSubmission: ({ accuracy, predictedLetter }) =>
        set({
          accuracy,
          predictedLetter,
          isSubmitting: false,
          captureState: "result",
        }),

      failPracticeSubmission: () =>
        set({ isSubmitting: false, captureState: "idle" }),

      markLessonCompleted: (lessonId) =>
        set((state) => {
          const units = state.units.map((unit) => {
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
          });
          return { units: applyGuestProgress(units) };
        }),
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

export { FS_PASS_THRESHOLD };
