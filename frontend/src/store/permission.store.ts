import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PermissionState {
  hasAgreed: boolean;
  hasSeenLandingDialog: boolean;
  setAgreed: () => void;
  markLandingDialogSeen: () => void;
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set) => ({
      hasAgreed: false,
      hasSeenLandingDialog: false,

      setAgreed: () => set({ hasAgreed: true }),
      markLandingDialogSeen: () => set({ hasSeenLandingDialog: true }),
    }),
    {
      name: "ksl:permissions",
      partialize: (state) => ({
        hasAgreed: state.hasAgreed,
        hasSeenLandingDialog: state.hasSeenLandingDialog,
      }),
    },
  ),
);
