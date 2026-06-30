/**
 * Word-detection curriculum API.
 * Currently returns mock data synchronously.
 * Swap for real apiFetch calls once the backend is ready.
 */

import type { WdChapter, WdLesson, WdLessonDetail, WdUnit } from "../types";
import type { WdTrackUnit } from "../store/types";
import { mockWordDetectionCurriculum } from "../data/mockCurriculum";

// ─── Track loader ────────────────────────────────────────────────────────────

export function fetchWdTrackUnits(): WdTrackUnit[] {
  return mockWordDetectionCurriculum;
}

// ─── Lesson detail helpers ────────────────────────────────────────────────────

export function fetchWdLesson(id: number): WdLessonDetail | null {
  for (const unit of mockWordDetectionCurriculum) {
    for (const chapter of unit.chapters) {
      const found = chapter.lessons.find((l) => l.id === id);
      if (found) return { ...found };
    }
  }
  return null;
}

export function fetchWdChapter(chapterId: number): WdChapter | null {
  for (const unit of mockWordDetectionCurriculum) {
    const found = unit.chapters.find((c) => c.id === chapterId);
    if (!found) continue;
    return {
      id: found.id,
      unitId: found.unitId,
      title: found.title,
      titleKh: found.titleKh,
      description: found.description,
      descriptionKh: found.descriptionKh,
      orderIndex: found.orderIndex,
      lessonCount: found.lessonCount,
      completedLessonCount: found.completedLessonCount,
      isLocked: found.isLocked,
    };
  }
  return null;
}

export function fetchWdUnit(unitId: number): WdUnit | null {
  const found = mockWordDetectionCurriculum.find((u) => u.id === unitId);
  if (!found) return null;
  return {
    id: found.id,
    title: found.title,
    titleKh: found.titleKh,
    category: found.category,
    categoryKh: found.categoryKh,
    orderIndex: found.orderIndex,
    chapterCount: found.chapterCount,
    completedLessonCount: found.completedLessonCount,
    totalLessonCount: found.totalLessonCount,
    isLocked: found.isLocked,
  };
}

export function fetchWdLessons(chapterId: number): WdLesson[] {
  for (const unit of mockWordDetectionCurriculum) {
    const found = unit.chapters.find((c) => c.id === chapterId);
    if (found) return [...found.lessons];
  }
  return [];
}

export function fetchWdLessonsInChapter(chapterId: number): WdLesson[] {
  return fetchWdLessons(chapterId);
}
