"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFsChapterExercise,
  fetchFsExercises,
  submitFsExercise,
} from "../api/practice";
import type { FsQuizSubmitAnswer } from "../types";

export const fsPracticeKeys = {
  all: ["fs-practice"] as const,
  exercises: () => [...fsPracticeKeys.all, "exercises"] as const,
  chapter: (chapterId: number) =>
    [...fsPracticeKeys.all, "chapter", chapterId] as const,
};

export function useFsExercises() {
  return useQuery({
    queryKey: fsPracticeKeys.exercises(),
    queryFn: fetchFsExercises,
  });
}

export function useFsChapterExercise(chapterId: number) {
  return useQuery({
    queryKey: fsPracticeKeys.chapter(chapterId),
    queryFn: () => fetchFsChapterExercise(chapterId),
    enabled: chapterId > 0,
  });
}

export function useSubmitFsExercise(chapterId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: FsQuizSubmitAnswer[]) =>
      submitFsExercise(chapterId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fsPracticeKeys.exercises() });
      queryClient.invalidateQueries({
        queryKey: fsPracticeKeys.chapter(chapterId),
      });
    },
  });
}
