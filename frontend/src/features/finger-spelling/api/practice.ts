import type {
  FsBackendExercise,
  FsBackendExerciseSubmitResponse,
  FsChapterExercise,
  FsExercise,
  FsQuizResult,
  FsQuizSubmitAnswer,
} from "../types";
import {
  adaptBackendChapterExercise,
  chapterToExercise,
} from "./adapters";
import { fsFetch } from "./client";
import { fetchFsChapters, fetchFsChapter, fetchFsUnits } from "./curriculum";

export async function fetchFsExercises(): Promise<FsExercise[]> {
  const units = await fetchFsUnits();
  const exercises: FsExercise[] = [];

  for (const unit of units) {
    const chapters = await fetchFsChapters(unit.id);
    for (const chapter of chapters) {
      exercises.push({
        ...chapterToExercise(chapter),
        unitOrderIndex: unit.orderIndex,
      });
    }
  }

  return exercises;
}

export async function fetchFsChapterExercise(
  chapterId: number
): Promise<FsChapterExercise | null> {
  const chapter = await fetchFsChapter(chapterId);
  if (!chapter) return null;

  try {
    const exercises = await fsFetch<FsBackendExercise[]>(
      `/api/finger_spelling/exercise/chapters/${chapterId}`
    );
    return adaptBackendChapterExercise(chapter, exercises);
  } catch (error) {
    if (error instanceof Error && error.message.includes("403")) {
      return null;
    }
    throw error;
  }
}

export async function submitFsExercise(
  chapterId: number,
  answers: FsQuizSubmitAnswer[]
): Promise<FsQuizResult> {
  const responses: FsBackendExerciseSubmitResponse[] = [];
  for (const answer of answers) {
    const exerciseId = answer.exerciseId ?? Number(answer.questionId);
    if (!Number.isFinite(exerciseId)) continue;

    const response = await fsFetch<FsBackendExerciseSubmitResponse>(
      `/api/finger_spelling/exercise/${exerciseId}/submit`,
      {
        method: "POST",
        body: JSON.stringify({
          selected_option_id:
            answer.selectedBackendOptionId ??
            (answer.selectedOptionId ? Number(answer.selectedOptionId) : undefined),
          selected_answer: answer.freeText,
          time_taken: answer.timeTaken,
        }),
      }
    );
    responses.push(response);
  }

  const score = responses.filter((response) => response.is_correct).length;
  const maxScore = Math.max(responses.length, 1);
  return {
    score,
    maxScore,
    passed: score >= Math.ceil(maxScore * 0.6),
  };
}
