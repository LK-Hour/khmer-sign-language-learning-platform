import type { FsChapter, FsLesson, FsLessonDetail, FsUnit } from "../types";
import {
  normalizeChapter,
  normalizeLesson,
  normalizeLessonDetail,
  normalizeUnit,
} from "./adapters";
import { fsFetch } from "./client";

export async function fetchFsUnits(): Promise<FsUnit[]> {
  const raw = await fsFetch<FsUnit[]>("/api/finger_spelling/units");
  return raw.map(normalizeUnit);
}

export async function fetchFsUnit(unitId: number): Promise<FsUnit | null> {
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
  const raw = await fsFetch<FsChapter[]>(
    `/api/finger_spelling/units/${unitId}/chapters`
  );
  return raw.map(normalizeChapter);
}

export async function fetchFsChapter(
  chapterId: number
): Promise<FsChapter | null> {
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
  const raw = await fsFetch<FsLesson[]>(
    `/api/finger_spelling/chapters/${chapterId}/lessons`
  );
  return raw.map(normalizeLesson);
}

export async function fetchFsLesson(
  lessonId: number
): Promise<FsLessonDetail | null> {
  try {
    const lesson = await fsFetch<FsLessonDetail>(
      `/api/finger_spelling/lessons/${lessonId}`
    );
    return normalizeLessonDetail(lesson);
  } catch {
    return null;
  }
}
