import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminThemeState {
  mode: "light" | "dark";
  toggleMode: () => void;
}

export const useAdminThemeStore = create<AdminThemeState>()(
  persist(
    (set) => ({
      mode: "light",
      toggleMode: () => set((s) => ({ mode: s.mode === "light" ? "dark" : "light" })),
    }),
    { name: "admin-theme-mode" },
  ),
);
