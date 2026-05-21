import {
  getMockChapter,
  getMockChapters,
  getMockLesson,
  getMockLessons,
  getMockUnit,
  mockUnits,
} from "../data/mockCurriculum";
import type { FsChapter, FsLesson, FsLessonDetail, FsUnit } from "../types";
import { fsFetch } from "./client";

const USE_MOCK = process.env.NEXT_PUBLIC_FS_USE_MOCK !== "false";

export async function fetchFsUnits(): Promise<FsUnit[]> {
  if (USE_MOCK) return mockUnits;
  try {
    return await fsFetch<FsUnit[]>("/api/finger_spelling/units");
  } catch {
    return mockUnits;
  }
}

export async function fetchFsUnit(unitId: number): Promise<FsUnit | null> {
  if (USE_MOCK) return getMockUnit(unitId) ?? null;
  try {
    return await fsFetch<FsUnit>(`/api/finger_spelling/units/${unitId}`);
  } catch {
    return getMockUnit(unitId) ?? null;
  }
}

export async function fetchFsChapters(unitId: number): Promise<FsChapter[]> {
  if (USE_MOCK) return getMockChapters(unitId);
  try {
    return await fsFetch<FsChapter[]>(
      `/api/finger_spelling/units/${unitId}/chapters`
    );
  } catch {
    return getMockChapters(unitId);
  }
}

export async function fetchFsChapter(
  chapterId: number
): Promise<FsChapter | null> {
  if (USE_MOCK) return getMockChapter(chapterId) ?? null;
  try {
    return await fsFetch<FsChapter>(
      `/api/finger_spelling/chapters/${chapterId}`
    );
  } catch {
    return getMockChapter(chapterId) ?? null;
  }
}

export async function fetchFsLessons(chapterId: number): Promise<FsLesson[]> {
  if (USE_MOCK) return getMockLessons(chapterId);
  try {
    return await fsFetch<FsLesson[]>(
      `/api/finger_spelling/chapters/${chapterId}/lessons`
    );
  } catch {
    return getMockLessons(chapterId);
  }
}

export async function fetchFsLesson(
  lessonId: number
): Promise<FsLessonDetail | null> {
  if (USE_MOCK) return getMockLesson(lessonId) ?? null;
  try {
    return await fsFetch<FsLessonDetail>(
      `/api/finger_spelling/lessons/${lessonId}`
    );
  } catch {
    return getMockLesson(lessonId) ?? null;
  }
}
