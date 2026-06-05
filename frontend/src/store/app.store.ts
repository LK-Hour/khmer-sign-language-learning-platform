import { create } from "zustand";

interface AppState {
  useMock: boolean;
  setUseMock: (useMock: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  useMock: process.env.NEXT_PUBLIC_FS_USE_MOCK === "true",
  setUseMock: (useMock) => set({ useMock }),
}));
