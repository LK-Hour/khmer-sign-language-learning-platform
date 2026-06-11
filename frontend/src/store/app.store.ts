import { create } from "zustand";

interface AppState {
  useMock: boolean;
  setUseMock: (useMock: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  useMock: false,
  setUseMock: (useMock) => set({ useMock }),
}));
