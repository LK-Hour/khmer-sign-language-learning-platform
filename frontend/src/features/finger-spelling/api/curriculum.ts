import type { FsChapter, FsLesson, FsLessonDetail, FsUnit } from "../types";
import type { FsTrackUnit } from "../store/types";
import {
  normalizeChapter,
  normalizeLesson,
  normalizeLessonDetail,
  normalizeUnit,
} from "./adapters";
import { apiFetch } from "@/utils/api/client";

export async function fetchFsUnits(): Promise<FsUnit[]> {
  const raw = await apiFetch<FsUnit[]>("/api/finger_spelling/units");
  return raw?.map(normalizeUnit);
}

export async function fetchFsUnit(unitId: number): Promise<FsUnit | null> {
  try {
    const unit = await apiFetch<FsUnit>(
      `/api/finger_spelling/units/${unitId}`
    );
    return normalizeUnit(unit);
  } catch {
    return null;
  }
}

export async function fetchFsChapters(unitId: number): Promise<FsChapter[]> {
  const raw = await apiFetch<FsChapter[]>(
    `/api/finger_spelling/units/${unitId}/chapters`
  );
  return raw?.map(normalizeChapter);
}

export async function fetchFsChapter(
  chapterId: number
): Promise<FsChapter | null> {
  try {
    const chapter = await apiFetch<FsChapter>(
      `/api/finger_spelling/chapters/${chapterId}`
    );
    return normalizeChapter(chapter);
  } catch {
    return null;
  }
}

export async function fetchFsLessons(chapterId: number): Promise<FsLesson[]> {
  const raw = await apiFetch<FsLesson[]>(
    `/api/finger_spelling/chapters/${chapterId}/lessons`
  );
  return raw?.map(normalizeLesson);
}

export async function fetchFsLesson(
  lessonId: number
): Promise<FsLessonDetail | null> {
  try {
    const lesson = await apiFetch<FsLessonDetail>(
      `/api/finger_spelling/lessons/${lessonId}`
    );
    return normalizeLessonDetail(lesson);
  } catch {
    return null;
  }
}

export async function fetchFsTrackUnits(): Promise<FsTrackUnit[]> {
  const baseUnits = (await fetchFsUnits()).sort(
    (a, b) => a?.orderIndex - b?.orderIndex
  );

  return Promise.all(
    baseUnits.map(async (unit) => {
      const chapters = (await fetchFsChapters(unit?.id)).sort(
        (a, b) => a?.orderIndex - b?.orderIndex
      );
      const chaptersWithLessons = await Promise.all(
        chapters.map(async (chapter) => {
          const lessons = (await fetchFsLessons(chapter?.id)).sort(
            (a, b) => a?.orderIndex - b?.orderIndex
          );

          return {
            ...chapter,
            lessons,
          };
        })
      );

      return {
        ...unit,
        chapters: chaptersWithLessons,
      };
    })
  );
}
