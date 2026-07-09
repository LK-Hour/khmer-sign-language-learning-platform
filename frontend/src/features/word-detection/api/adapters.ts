import type {
  WdChapter,
  WdLesson,
  WdLessonDetail,
  WdProgressStatus,
  WdUnit,
} from "../types";
import { statusToPercent } from "../utils/progress";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";

export function normalizeUnit(unit: WdUnit): WdUnit {
  return {
    id: unit?.id,
    title: unit?.title,
    titleKh: unit?.titleKh,
    category: unit?.category ?? null,
    categoryKh: unit?.categoryKh ?? null,
    orderIndex: unit?.orderIndex,
    chapterCount: unit?.chapterCount,
    completedLessonCount: unit?.completedLessonCount,
    totalLessonCount: unit?.totalLessonCount,
    isLocked: unit?.isLocked ?? false,
  };
}

export function normalizeChapter(chapter: WdChapter): WdChapter {
  return {
    id: chapter?.id,
    unitId: chapter?.unitId,
    title: chapter?.title,
    titleKh: chapter?.titleKh,
    description: chapter?.description ?? null,
    descriptionKh: chapter?.descriptionKh ?? null,
    orderIndex: chapter?.orderIndex,
    lessonCount: chapter?.lessonCount,
    completedLessonCount: chapter?.completedLessonCount,
    isLocked: chapter?.isLocked ?? false,
    isPracticeUnlocked: chapter?.isPracticeUnlocked ?? false,
    isPracticeComplete: chapter?.isPracticeComplete ?? false,
  };
}

export function normalizeLesson(lesson: WdLesson): WdLesson {
  const progressStatus = lesson?.progressStatus as WdProgressStatus;

  return {
    id: lesson?.id,
    chapterId: lesson?.chapterId,
    word: lesson?.word,
    wordEn: lesson?.wordEn ?? "",
    videoUrl: resolveApiAssetUrl(lesson?.videoUrl) ?? lesson?.videoUrl ?? "",
    orderIndex: lesson?.orderIndex,
    isLocked: lesson?.isLocked ?? false,
    progressStatus,
    progressPercent:
      lesson?.progressPercent ?? statusToPercent(progressStatus),
  };
}

export function normalizeLessonDetail(lesson: WdLessonDetail): WdLessonDetail {
  return {
    ...normalizeLesson(lesson),
    description: lesson?.description ?? null,
    descriptionKh: lesson?.descriptionKh ?? null,
  };
}
