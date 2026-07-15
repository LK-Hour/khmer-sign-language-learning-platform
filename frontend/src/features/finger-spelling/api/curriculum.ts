import type { FsChapter, FsChapterPractice, FsLesson, FsLessonDetail, FsUnit } from "../types";
import type { ExerciseSessionData, ExerciseSubmitRequest } from "../types/exercise";
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

export async function fetchFsChapterPractice(
  chapterId: number
): Promise<FsChapterPractice | null> {
  try {
    const data = await apiFetch<FsChapterPractice>(
      `/api/finger_spelling/chapters/${chapterId}/practice`
    );
    return data;
  } catch {
    return null;
  }
}

export async function fetchFsExerciseSession(unitId: number): Promise<ExerciseSessionData> {
  return apiFetch<ExerciseSessionData>(`/api/finger_spelling/units/${unitId}/exercise`);
}

export async function fetchFsGuestExerciseSession(
  unitId: number
): Promise<ExerciseSessionData> {
  return apiFetch<ExerciseSessionData>(
    `/api/finger_spelling/units/${unitId}/exercise/guest`,
    { skipAuth: true }
  );
}

export async function submitFsExercise(
  unitId: number,
  body: ExerciseSubmitRequest
): Promise<ExerciseSessionData> {
  return apiFetch<ExerciseSessionData>(
    `/api/finger_spelling/units/${unitId}/exercise/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}

export async function submitFsGuestExercise(
  unitId: number,
  body: ExerciseSubmitRequest & { question_ids: number[] }
): Promise<ExerciseSessionData> {
  return apiFetch<ExerciseSessionData>(
    `/api/finger_spelling/units/${unitId}/exercise/guest/grade`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      skipAuth: true,
    }
  );
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


/**
 * Fetch the full curriculum tree in a single request (aggregated endpoint).
 * Eliminates 30+ sequential API calls by returning units → chapters → lessons
 * in one response. The response shape matches FsTrackUnit[] directly.
 */
export async function fetchFsTree(): Promise<FsTrackUnit[]> {
  const raw = await apiFetch<FsTrackUnit[]>("/api/finger_spelling/tree");
  return raw
    .map((unit) => ({
      ...normalizeUnit(unit),
      chapters: unit.chapters
        .map((chapter) => ({
          ...normalizeChapter(chapter),
          lessons: chapter.lessons.map(normalizeLesson),
        }))
        .sort((a, b) => a.orderIndex - b.orderIndex),
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);
}
