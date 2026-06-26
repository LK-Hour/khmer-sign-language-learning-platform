import type {
  FsChapter,
  FsLesson,
  FsLessonDetail,
  FsProgressStatus,
  FsUnit,
} from "../types";
import { resolveApiAssetUrl } from "./config";
import { statusToPercent } from "../utils/progress";

/** Matches backend `FsUnitResponse`. */
export function normalizeUnit(unit: FsUnit): FsUnit {
  const name = (unit?.title || unit?.titleKh || "").toLowerCase();
  let category: string | null = unit?.category ?? null;
  if (!category && name) {
    if (name.includes("consonant")) category = "Consonant";
    else if (name.includes("vowel")) category = "Vowel";
  }
  return {
    id: unit?.id,
    title: unit?.title,
    titleKh: unit?.titleKh,
    category,
    orderIndex: unit?.orderIndex,
    chapterCount: unit?.chapterCount,
    completedLessonCount: unit?.completedLessonCount,
    totalLessonCount: unit?.totalLessonCount,
    isLocked: unit?.isLocked ?? false,
  };
}

/** Matches backend `FsChapterResponse`. */
export function normalizeChapter(chapter: FsChapter): FsChapter {
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
    isExerciseUnlocked: chapter?.isExerciseUnlocked,
    isLocked: chapter?.isLocked ?? false,
  };
}

/** Matches backend `FsLessonResponse` / `FsLessonDetailResponse`. */
export function normalizeLesson(lesson: FsLesson): FsLesson {
  const progressStatus = lesson?.progressStatus as FsProgressStatus;

  return {

    id: lesson?.id,
    chapterId: lesson?.chapterId,
    letterId: lesson?.letterId,
    letter: lesson?.letter,
    romanization: lesson?.romanization ?? null,
    letterNameEn: lesson?.letterNameEn ?? null,
    letterNameKh: lesson?.letterNameKh ?? null,
    imageUrl: resolveApiAssetUrl(lesson?.imageUrl) ?? lesson?.imageUrl,
    orderIndex: lesson?.orderIndex,
    isLocked: lesson?.isLocked,
    progressStatus,
    progressPercent:
      lesson?.progressPercent ?? statusToPercent(progressStatus),
  };
}

export function normalizeLessonDetail(lesson: FsLessonDetail): FsLessonDetail {
  return {
    ...normalizeLesson(lesson),
    description: lesson?.description ?? null,
    descriptionKh: lesson?.descriptionKh ?? null,
  };
}
