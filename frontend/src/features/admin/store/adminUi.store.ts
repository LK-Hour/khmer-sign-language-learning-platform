import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AdminTrack } from "../api/types";
import { toggleAccordionPath } from "../components/sidebar/navUtils";

export type AdminEntityTab = "units" | "chapters" | "lessons";

interface AdminUiState {
  track: AdminTrack;
  curriculumTab: AdminEntityTab;
  sidebarCollapsed: boolean;
  /** Set of nav node IDs that are currently expanded */
  expandedNavIds: string[];
  setTrack: (track: AdminTrack) => void;
  setCurriculumTab: (tab: AdminEntityTab) => void;
  toggleSidebar: () => void;
  /**
   * Toggle a nav node accordion-style: only one branch stays open per level.
   * `ancestorIds` is the path from the root down to the node's parent.
   */
  toggleNavNode: (id: string, ancestorIds?: string[]) => void;
  /** Replace the expanded set (used to reveal the active route's branch) */
  expandNavNodes: (ids: string[]) => void;
  /** Collapse all nav nodes */
  collapseAllNav: () => void;
}

export const useAdminUiStore = create<AdminUiState>()(
  persist(
    (set) => ({
      track: "finger",
      curriculumTab: "units",
      sidebarCollapsed: false,
      expandedNavIds: [],
      setTrack: (track) => set({ track }),
      setCurriculumTab: (curriculumTab) => set({ curriculumTab }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleNavNode: (id, ancestorIds = []) =>
        set((state) => ({
          expandedNavIds: toggleAccordionPath(state.expandedNavIds, id, ancestorIds),
        })),
      expandNavNodes: (ids) =>
        set(() => ({
          expandedNavIds: [...new Set(ids)],
        })),
      collapseAllNav: () => set({ expandedNavIds: [] }),
    }),
    { name: "admin-ui-storage" },
  ),
);

/** Shared track toggle (curriculum + exercises). Survives hot reload via persist. */
export function useAdminTrack(): [AdminTrack, (track: AdminTrack) => void] {
  const track = useAdminUiStore((state) => state.track);
  const setTrack = useAdminUiStore((state) => state.setTrack);
  return [track, setTrack];
}

/** Units / chapters / lessons tab on the curriculum page. */
export function useAdminEntityTab(): [AdminEntityTab, (tab: AdminEntityTab) => void] {
  const tab = useAdminUiStore((state) => state.curriculumTab);
  const setTab = useAdminUiStore((state) => state.setCurriculumTab);
  return [tab, setTab];
}
