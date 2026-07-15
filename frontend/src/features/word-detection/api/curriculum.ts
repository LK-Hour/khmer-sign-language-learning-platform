/**
 * Word-detection curriculum API.
 * Fetches the real backend curriculum, mirroring finger-spelling/api/curriculum.ts.
 */

import type {
  WdChapter,
  WdChapterPractice,
  WdLesson,
  WdLessonDetail,
  WdUnit,
} from "../types";
import type { WdTrackUnit } from "../store/types";
import {
  normalizeChapter,
  normalizeLesson,
  normalizeLessonDetail,
  normalizeUnit,
} from "./adapters";
import { apiFetch } from "@/utils/api/client";

// ─── Units ─────────────────────────────────────────────────────────────────

export async function fetchWdUnits(): Promise<WdUnit[]> {
  const raw = await apiFetch<WdUnit[]>("/api/word_detection/units");
  return raw?.map(normalizeUnit);
}

export async function fetchWdUnit(unitId: number): Promise<WdUnit | null> {
  try {
    const unit = await apiFetch<WdUnit>(`/api/word_detection/units/${unitId}`);
    return normalizeUnit(unit);
  } catch {
    return null;
  }
}

// ─── Chapters ────────────────────────────────────────────────────────────────

export async function fetchWdChapters(unitId: number): Promise<WdChapter[]> {
  const raw = await apiFetch<WdChapter[]>(
    `/api/word_detection/units/${unitId}/chapters`
  );
  return raw?.map(normalizeChapter);
}

export async function fetchWdChapter(
  chapterId: number
): Promise<WdChapter | null> {
  try {
    const chapter = await apiFetch<WdChapter>(
      `/api/word_detection/chapters/${chapterId}`
    );
    return normalizeChapter(chapter);
  } catch {
    return null;
  }
}

// ─── Lessons ──────────────────────────────────────────────────────────────────

export async function fetchWdLessons(chapterId: number): Promise<WdLesson[]> {
  const raw = await apiFetch<WdLesson[]>(
    `/api/word_detection/chapters/${chapterId}/lessons`
  );
  return raw?.map(normalizeLesson);
}

export async function fetchWdLessonsInChapter(
  chapterId: number
): Promise<WdLesson[]> {
  return fetchWdLessons(chapterId);
}

export async function fetchWdLesson(
  lessonId: number
): Promise<WdLessonDetail | null> {
  try {
    const lesson = await apiFetch<WdLessonDetail>(
      `/api/word_detection/lessons/${lessonId}`
    );
    return normalizeLessonDetail(lesson);
  } catch {
    return null;
  }
}

// ─── Chapter practice ────────────────────────────────────────────────────────

export async function fetchWdChapterPractice(
  chapterId: number
): Promise<WdChapterPractice | null> {
  try {
    return await apiFetch<WdChapterPractice>(
      `/api/word_detection/chapters/${chapterId}/practice`
    );
  } catch {
    return null;
  }
}

// ─── Track loader ────────────────────────────────────────────────────────────

export async function fetchWdTrackUnits(): Promise<WdTrackUnit[]> {
  const baseUnits = (await fetchWdUnits()).sort(
    (a, b) => a?.orderIndex - b?.orderIndex
  );

  return Promise.all(
    baseUnits.map(async (unit) => {
      const chapters = (await fetchWdChapters(unit?.id)).sort(
        (a, b) => a?.orderIndex - b?.orderIndex
      );
      const chaptersWithLessons = await Promise.all(
        chapters.map(async (chapter) => {
          const lessons = (await fetchWdLessons(chapter?.id)).sort(
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
 * in one response. The response shape matches WdTrackUnit[] directly.
 */
export async function fetchWdTree(): Promise<WdTrackUnit[]> {
  const raw = await apiFetch<WdTrackUnit[]>("/api/word_detection/tree");
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
