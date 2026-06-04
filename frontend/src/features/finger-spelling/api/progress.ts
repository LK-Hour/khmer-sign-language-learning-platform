import type { FsChapterProgress, FsLessonProgress } from "../types";
import { fsFetch } from "./client";

export async function fetchFsLessonProgress(
  lessonId: number
): Promise<FsLessonProgress> {
  return fsFetch<FsLessonProgress>(
    `/api/finger_spelling/progress/lessons/${lessonId}`
  );
}

export async function fetchFsChapterProgress(
  chapterId: number
): Promise<FsChapterProgress> {
  return fsFetch<FsChapterProgress>(
    `/api/finger_spelling/progress/chapters/${chapterId}`
  );
}
