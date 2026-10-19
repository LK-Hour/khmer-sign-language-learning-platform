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
import { apiFetch, isNotFoundError } from "@/utils/api/client";

// ─── Units ─────────────────────────────────────────────────────────────────

export async function fetchWdUnits(): Promise<WdUnit[]> {
  const raw = await apiFetch<WdUnit[]>("/api/word_detection/units");
  return raw?.map(normalizeUnit);
}

export async function fetchWdUnit(unitId: number): Promise<WdUnit | null> {
  try {
    const unit = await apiFetch<WdUnit>(`/api/word_detection/units/${unitId}`);
    return normalizeUnit(unit);
  } catch (err) {
    if (isNotFoundError(err)) return null;
    throw err;
  }
}

// ─── Chapters ────────────────────────────────────────────────────────────────

export async function fetchWdChapter(
  chapterId: number
): Promise<WdChapter | null> {
  try {
    const chapter = await apiFetch<WdChapter>(
      `/api/word_detection/chapters/${chapterId}`
    );
    return normalizeChapter(chapter);
  } catch (err) {
    if (isNotFoundError(err)) return null;
    throw err;
  }
}

// ─── Lessons ──────────────────────────────────────────────────────────────────

export async function fetchWdLessons(chapterId: number): Promise<WdLesson[]> {
  const raw = await apiFetch<WdLesson[]>(
    `/api/word_detection/chapters/${chapterId}/lessons`
  );
  return raw?.map(normalizeLesson);
}

export async function fetchWdLesson(
  lessonId: number
): Promise<WdLessonDetail | null> {
  try {
    const lesson = await apiFetch<WdLessonDetail>(
      `/api/word_detection/lessons/${lessonId}`
    );
    return normalizeLessonDetail(lesson);
  } catch (err) {
    if (isNotFoundError(err)) return null;
    throw err;
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

/**
 * Fetch the full curriculum tree in a single request (aggregated endpoint).
 * Returns units → chapters → lessons in one response.
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


export async function fetchWdLessonLearning(lessonId: number): Promise<{
  lesson: WdLessonDetail; chapter: WdChapter; unit: WdUnit; nextLessonId: number | null;
} | null> {
  try {
    const raw = await apiFetch<{
      lesson: WdLessonDetail; chapter: WdChapter; unit: WdUnit; nextLessonId: number | null;
    }>(`/api/word_detection/lessons/${lessonId}/learning`);
    return { ...raw, lesson: normalizeLessonDetail(raw.lesson), chapter: normalizeChapter(raw.chapter), unit: normalizeUnit(raw.unit) };
  } catch (err) {
    if (isNotFoundError(err)) return null;
    throw err;
  }
}
