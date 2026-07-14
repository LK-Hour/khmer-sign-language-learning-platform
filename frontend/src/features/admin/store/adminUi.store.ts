import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AdminTrack } from "../api/types";

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
  /** Toggle a single nav node's expanded state */
  toggleNavNode: (id: string) => void;
  /** Expand multiple nodes at once (for auto-expand on route match) */
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
      toggleNavNode: (id) =>
        set((state) => ({
          expandedNavIds: state.expandedNavIds.includes(id)
            ? state.expandedNavIds.filter((nid) => nid !== id)
            : [...state.expandedNavIds, id],
        })),
      expandNavNodes: (ids) =>
        set((state) => ({
          expandedNavIds: [...new Set([...state.expandedNavIds, ...ids])],
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
