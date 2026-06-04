"use client";

import { create } from "zustand";
import type { FsChapterExercise, FsQuizQuestion } from "../types";

type QuizStatus = "idle" | "active" | "completed";

interface QuizState {
  chapterId: number | null;
  exercise: FsChapterExercise | null;
  questionIndex: number;
  score: number;
  status: QuizStatus;
  selections: Record<string, string>;
  freeText: Record<string, string>;
  start: (chapterId: number, exercise: FsChapterExercise) => void;
  selectOption: (questionId: string, optionId: string) => void;
  setFreeText: (questionId: string, text: string) => void;
  nextQuestion: () => void;
  complete: (score: number) => void;
  reset: () => void;
  currentQuestion: () => FsQuizQuestion | null;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  chapterId: null,
  exercise: null,
  questionIndex: 0,
  score: 0,
  status: "idle",
  selections: {},
  freeText: {},

  start: (chapterId, exercise) =>
    set({
      chapterId,
      exercise,
      questionIndex: 0,
      score: 0,
      status: "active",
      selections: {},
      freeText: {},
    }),

  selectOption: (questionId, optionId) =>
    set((s) => ({
      selections: { ...s.selections, [questionId]: optionId },
    })),

  setFreeText: (questionId, text) =>
    set((s) => ({
      freeText: { ...s.freeText, [questionId]: text },
    })),

  nextQuestion: () => {
    const { exercise, questionIndex } = get();
    if (!exercise) return;
    if (questionIndex + 1 >= exercise.questions.length) {
      set({ status: "completed" });
      return;
    }
    set({ questionIndex: questionIndex + 1 });
  },

  complete: (score) => set({ score, status: "completed" }),

  reset: () =>
    set({
      chapterId: null,
      exercise: null,
      questionIndex: 0,
      score: 0,
      status: "idle",
      selections: {},
      freeText: {},
    }),

  currentQuestion: () => {
    const { exercise, questionIndex } = get();
    if (!exercise) return null;
    return exercise.questions[questionIndex] ?? null;
  },
}));
