import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AdminTrack } from "../api/types";

export type AdminEntityTab = "units" | "chapters" | "lessons";

interface AdminUiState {
  track: AdminTrack;
  curriculumTab: AdminEntityTab;
  setTrack: (track: AdminTrack) => void;
  setCurriculumTab: (tab: AdminEntityTab) => void;
}

export const useAdminUiStore = create<AdminUiState>()(
  persist(
    (set) => ({
      track: "finger",
      curriculumTab: "units",
      setTrack: (track) => set({ track }),
      setCurriculumTab: (curriculumTab) => set({ curriculumTab }),
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
