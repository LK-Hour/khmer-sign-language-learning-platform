import type {
  FsBackendExercise,
  FsChapter,
  FsChapterExercise,
  FsExercise,
  FsLesson,
  FsLessonDetail,
  FsProgressStatus,
  FsUnit,
} from "../types";
import type { QuizQuestion, QuizQuestionType } from "@/components/quiz/types";
import { resolveApiAssetUrl } from "./config";
import { statusToPercent } from "../utils/progress";

/** Matches backend `FsUnitResponse`. */
export function normalizeUnit(unit: FsUnit): FsUnit {
  return {
    id: unit.id,
    title: unit.title,
    titleKh: unit.titleKh,
    category: unit.category ?? null,
    orderIndex: unit.orderIndex,
    chapterCount: unit.chapterCount,
    completedLessonCount: unit.completedLessonCount,
    totalLessonCount: unit.totalLessonCount,
    isLocked: unit.isLocked ?? false,
  };
}

/** Matches backend `FsChapterResponse`. */
export function normalizeChapter(chapter: FsChapter): FsChapter {
  return {
    id: chapter.id,
    unitId: chapter.unitId,
    title: chapter.title,
    titleKh: chapter.titleKh,
    description: chapter.description ?? null,
    descriptionKh: chapter.descriptionKh ?? null,
    orderIndex: chapter.orderIndex,
    lessonCount: chapter.lessonCount,
    completedLessonCount: chapter.completedLessonCount,
    isExerciseUnlocked: chapter.isExerciseUnlocked,
    isLocked: chapter.isLocked ?? false,
  };
}

/** Matches backend `FsLessonResponse` / `FsLessonDetailResponse`. */
export function normalizeLesson(lesson: FsLesson): FsLesson {
  const progressStatus = lesson.progressStatus as FsProgressStatus;

  return {
    id: lesson.id,
    chapterId: lesson.chapterId,
    letter: lesson.letter,
    romanization: lesson.romanization ?? null,
    letterNameEn: lesson.letterNameEn ?? null,
    letterNameKh: lesson.letterNameKh ?? null,
    imageUrl: resolveApiAssetUrl(lesson.imageUrl) ?? lesson.imageUrl,
    orderIndex: lesson.orderIndex,
    isLocked: lesson.isLocked,
    progressStatus,
    progressPercent:
      lesson.progressPercent ?? statusToPercent(progressStatus),
  };
}

export function normalizeLessonDetail(lesson: FsLessonDetail): FsLessonDetail {
  return {
    ...normalizeLesson(lesson),
    description: lesson.description ?? null,
    descriptionKh: lesson.descriptionKh ?? null,
  };
}

export function chapterToExercise(chapter: FsChapter): FsExercise {
  return {
    id: chapter.id,
    chapterId: chapter.id,
    chapterOrderIndex: chapter.orderIndex,
    unitId: chapter.unitId,
    unitOrderIndex: 0,
    title: chapter.title,
    titleKh: chapter.titleKh,
    chapterDescription: chapter.description ?? null,
    chapterDescriptionKh: chapter.descriptionKh ?? null,
    isUnlocked: chapter.isExerciseUnlocked,
    score: 0,
    maxScore: 100,
  };
}

function toQuestionType(
  type: FsBackendExercise["exercise_type"]
): QuizQuestionType {
  if (type === "free_form") return "FREE_INPUT";
  if (type === "image_select") return "IMAGE_SELECT";
  if (type === "matching") return "MULTIPLE_CHOICE";
  return "MULTIPLE_CHOICE";
}

function mediaUrl(media: FsBackendExercise["media"]): string | undefined {
  return resolveApiAssetUrl(media?.file_url);
}

/** Map backend `ExerciseResponse[]` to frontend quiz shell shape. */
export function adaptBackendChapterExercise(
  chapter: FsChapter,
  exercises: FsBackendExercise[]
): FsChapterExercise | null {
  if (exercises.length === 0) return null;

  const questions: QuizQuestion[] = exercises.map((exercise) => ({
    id: String(exercise.id),
    type: toQuestionType(exercise.exercise_type),
    promptText: exercise.question_kh || exercise.question_en,
    promptImageUrl: mediaUrl(exercise.media),
    correctOptionId: "",
    options: exercise.options.map((option) => ({
      id: String(option.id),
      letter: option.option_text_kh ?? option.option_text_en ?? "",
      romanization: option.option_text_en ?? undefined,
      imageUrl: mediaUrl(option.media),
    })),
  }));

  return {
    chapterId: chapter.id,
    title: `Exercise: ${chapter.title}`,
    subtitle:
      chapter.description ??
      "Check your knowledge on foundation in this chapter.",
    maxScore: exercises.length,
    backendExercises: exercises,
    questions,
  };
}
