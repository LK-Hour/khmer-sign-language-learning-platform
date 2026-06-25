import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WdTrackUnit } from "./types";
import {
  buildInitialChapterExpansion,
  resolveInitialUnitId,
} from "./trackState";

export interface WordDetectionState {
  units: WdTrackUnit[];
  expandedUnitId: number | null;
  expandedChapterIds: Record<number, boolean>;

  setUnits: (units: WdTrackUnit[]) => void;
  toggleUnitExpanded: (unitId: number) => void;
  toggleChapterExpanded: (chapterId: number) => void;
  isChapterExpanded: (chapterId: number) => boolean;
}

export const useWordDetectionStore = create<WordDetectionState>()(
  persist(
    (set, get) => ({
      units: [],
      expandedUnitId: null,
      expandedChapterIds: {},

      setUnits: (units) =>
        set((state) => {
          const expandedUnitId =
            state.expandedUnitId != null &&
            units.some(
              (u) => u?.id === state.expandedUnitId && u?.isLocked !== true
            )
              ? state.expandedUnitId
              : resolveInitialUnitId(units);

          const hasExpandedChapters =
            Object.keys(state.expandedChapterIds).length > 0;
          const expandedChapterIds = hasExpandedChapters
            ? state.expandedChapterIds
            : buildInitialChapterExpansion(units);

          return { units, expandedUnitId, expandedChapterIds };
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
