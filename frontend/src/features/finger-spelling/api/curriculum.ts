import {
  getMockChapter,
  getMockChapters,
  getMockLesson,
  getMockLessons,
  getMockUnit,
  mockUnits,
} from "../data/mockCurriculum";
import type { FsChapter, FsLesson, FsLessonDetail, FsUnit } from "../types";
import {
  normalizeChapter,
  normalizeLesson,
  normalizeLessonDetail,
  normalizeUnit,
} from "./adapters";
import { FS_USE_MOCK } from "./config";
import { fsFetch } from "./client";

export async function fetchFsUnits(): Promise<FsUnit[]> {
  const raw = FS_USE_MOCK
    ? mockUnits
    : await fsFetch<FsUnit[]>("/api/finger_spelling/units");
  return raw.map(normalizeUnit);
}

export async function fetchFsUnit(unitId: number): Promise<FsUnit | null> {
  if (FS_USE_MOCK) {
    const unit = getMockUnit(unitId);
    return unit ? normalizeUnit(unit) : null;
  }

  try {
    const unit = await fsFetch<FsUnit>(
      `/api/finger_spelling/units/${unitId}`
    );
    return normalizeUnit(unit);
  } catch {
    return null;
  }
}

export async function fetchFsChapters(unitId: number): Promise<FsChapter[]> {
  const raw = FS_USE_MOCK
    ? getMockChapters(unitId)
    : await fsFetch<FsChapter[]>(
        `/api/finger_spelling/units/${unitId}/chapters`
      );
  return raw.map(normalizeChapter);
}

export async function fetchFsChapter(
  chapterId: number
): Promise<FsChapter | null> {
  if (FS_USE_MOCK) {
    const chapter = getMockChapter(chapterId);
    return chapter ? normalizeChapter(chapter) : null;
  }

  try {
    const chapter = await fsFetch<FsChapter>(
      `/api/finger_spelling/chapters/${chapterId}`
    );
    return normalizeChapter(chapter);
  } catch {
    return null;
  }
}

export async function fetchFsLessons(chapterId: number): Promise<FsLesson[]> {
  const raw = FS_USE_MOCK
    ? getMockLessons(chapterId)
    : await fsFetch<FsLesson[]>(
        `/api/finger_spelling/chapters/${chapterId}/lessons`
      );
  return raw.map(normalizeLesson);
}

export async function fetchFsLesson(
  lessonId: number
): Promise<FsLessonDetail | null> {
  if (FS_USE_MOCK) {
    const lesson = getMockLesson(lessonId);
    return lesson ? normalizeLessonDetail(lesson) : null;
  }

  try {
    const lesson = await fsFetch<FsLessonDetail>(
      `/api/finger_spelling/lessons/${lessonId}`
    );
    return normalizeLessonDetail(lesson);
  } catch {
    return null;
  }
}
