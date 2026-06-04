"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchFsLessons } from "../api/curriculum";

export const fsCurriculumKeys = {
  all: ["fs-curriculum"] as const,
  lessons: (chapterId: number) =>
    [...fsCurriculumKeys.all, "lessons", chapterId] as const,
};

export function useFsLessons(chapterId: number, enabled: boolean) {
  return useQuery({
    queryKey: fsCurriculumKeys.lessons(chapterId),
    queryFn: () => fetchFsLessons(chapterId),
    enabled: enabled && chapterId > 0,
  });
}
