import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "@/store/auth.store";
import type { WdTrackUnit } from "./types";
import {
  buildInitialChapterExpansion,
  mergeUnitsProgress,
  resolveInitialUnitId,
} from "./trackState";
import { useWordDetectionGuestProgressStore } from "./guestProgress.store";
import { isChapterPracticeUnlocked } from "../utils/chapterPracticeUnlock";

export interface WordDetectionState {
  units: WdTrackUnit[];
  expandedUnitId: number | null;
  expandedChapterIds: Record<number, boolean>;

  setUnits: (units: WdTrackUnit[]) => void;
  toggleUnitExpanded: (unitId: number) => void;
  toggleChapterExpanded: (chapterId: number) => void;
  isChapterExpanded: (chapterId: number) => boolean;
  markPracticeCompleted: (chapterId: number) => void;
}

function applyGuestProgress(units: WdTrackUnit[]): WdTrackUnit[] {
  const authUser = useAuthStore.getState().user;
  if (!authUser?.is_guest) return units;

  const completedLessons = new Set(
    Object.values(useWordDetectionGuestProgressStore.getState().lessons)
      .filter((lesson) => lesson?.isCompleted)
      .map((lesson) => lesson?.lessonId)
  );
  const completedChapterPractices = new Set(
    useWordDetectionGuestProgressStore.getState().completedChapterPracticeIds
  );

  return units.map((unit) => {
    let unitCompleted = 0;
    let hasUnlockedLessonInUnit = false;
    const chapters = unit.chapters.map((chapter) => {
      let chapterCompleted = 0;
      let hasUnlockedLessonInChapter = false;
      const lessons = chapter.lessons.map((lesson) => {
        const isCompleted = completedLessons.has(lesson?.id);
        const isUnlocked = !lesson?.isLocked || isCompleted;
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
          progressStatus: isCompleted
            ? ("COMPLETED" as const)
            : lesson?.progressStatus,
          progressPercent: isCompleted ? 100 : lesson?.progressPercent,
        };
      });
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
        completedLessonCount: Math.max(
          chapter?.completedLessonCount ?? 0,
          chapterCompleted
        ),
      };
    });
    return {
      ...unit,
      isLocked: !hasUnlockedLessonInUnit,
      chapters,
      completedLessonCount: Math.max(
        unit?.completedLessonCount ?? 0,
        unitCompleted
      ),
    };
  });
}

export const useWordDetectionStore = create<WordDetectionState>()(
  persist(
    (set, get) => ({
      units: [],
      expandedUnitId: null,
      expandedChapterIds: {},

      setUnits: (units) =>
        set((state) => {
          const authUser = useAuthStore.getState().user;
          const incomingUnits = applyGuestProgress(units);
          const mergedUnits = authUser?.is_guest
            ? mergeUnitsProgress(state.units, incomingUnits)
            : incomingUnits;
          const expandedUnitId =
            state.expandedUnitId != null &&
            mergedUnits.some(
              (u) => u?.id === state.expandedUnitId && u?.isLocked !== true
            )
              ? state.expandedUnitId
              : resolveInitialUnitId(mergedUnits);

          const hasExpandedChapters =
            Object.keys(state.expandedChapterIds).length > 0;
          const expandedChapterIds = hasExpandedChapters
            ? state.expandedChapterIds
            : buildInitialChapterExpansion(mergedUnits);

          return { units: mergedUnits, expandedUnitId, expandedChapterIds };
        }),

      toggleUnitExpanded: (unitId) =>
        set((state) => ({
          expandedUnitId:
            state.expandedUnitId === unitId ? null : unitId,
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

      markPracticeCompleted: (chapterId) =>
        set((state) => {
          const authUser = useAuthStore.getState().user;
          if (authUser?.is_guest) {
            useWordDetectionGuestProgressStore
              .getState()
              .recordChapterPracticeComplete(chapterId);
          }

          const units = state.units.map((unit) => ({
            ...unit,
            chapters: unit?.chapters.map((chapter) =>
              chapter?.id === chapterId
                ? { ...chapter, isPracticeComplete: true }
                : chapter
            ),
          }));

          return { units };
        }),
    }),
    {
      name: "word-detection-ui",
      partialize: (state) => ({
        expandedUnitId: state.expandedUnitId,
        expandedChapterIds: state.expandedChapterIds,
      }),
    }
  )
);
