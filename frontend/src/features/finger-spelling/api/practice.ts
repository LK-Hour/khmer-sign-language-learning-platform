import {
  getMockChapterExerciseFromBackend,
  getMockCorrectOptionId,
  getMockExercisesFromChapters,
} from "../data/mockPractice";
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
import { FS_USE_MOCK } from "./config";
import { fsFetch } from "./client";
import { fetchFsChapters, fetchFsChapter, fetchFsUnits } from "./curriculum";

export async function fetchFsExercises(): Promise<FsExercise[]> {
  if (FS_USE_MOCK) {
    return getMockExercisesFromChapters();
  }

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
  if (FS_USE_MOCK) {
    return getMockChapterExerciseFromBackend(chapterId);
  }

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
    if (FS_USE_MOCK) {
    const exercise = await getMockChapterExerciseFromBackend(chapterId);
    if (!exercise) {
      return { score: 0, maxScore: 100, passed: false };
    }

    const backendExercises = exercise.backendExercises ?? [];
    let score = 0;

    for (const answer of answers) {
      const exerciseId = answer.exerciseId ?? Number(answer.questionId);
      const backend = backendExercises.find((item) => item.id === exerciseId);
      if (!backend) continue;

      const correctOptionId = getMockCorrectOptionId(backend);
      const selectedOptionId =
        answer.selectedBackendOptionId ??
        (answer.selectedOptionId ? Number(answer.selectedOptionId) : undefined);

      if (backend.exercise_type === "free_form") {
        const expected = backend.options[0]?.option_text_en?.toLowerCase();
        if (expected && answer.freeText?.trim().toLowerCase() === expected) {
          score += 1;
        }
        continue;
      }

      if (correctOptionId && selectedOptionId === correctOptionId) {
        score += 1;
      }
    }

    const maxScore = Math.max(backendExercises.length, 1);
    return {
      score,
      maxScore,
      passed: score >= Math.ceil(maxScore * 0.6),
    };
  }

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
