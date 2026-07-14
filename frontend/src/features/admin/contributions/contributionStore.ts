import { create } from "zustand";

interface ContributionStoreState {
  selectedWordId: number | null;
  setSelectedWordId: (wordId: number | null) => void;
}

export const useContributionStore = create<ContributionStoreState>((set) => ({
  selectedWordId: null,
  setSelectedWordId: (wordId) => set({ selectedWordId: wordId }),
}));
