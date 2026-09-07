import { apiFetch } from "@/utils/api/client";
import type {
  WdExerciseQuestionData,
  WdExerciseSubmitRequest,
  WdExerciseSubmitResult,
} from "../types/exercise";

/** Fetch all exercises belonging to a unit. Free-form questions are filtered
 * out: the backend cannot grade them yet (no correct_answer column on the
 * exercise model). */
export async function fetchWdUnitExercises(
  unitId: number
): Promise<WdExerciseQuestionData[]> {
  const raw = await apiFetch<WdExerciseQuestionData[]>(
    `/api/word_detection/exercise/units/${unitId}`
  );
  return raw.filter((exercise) => exercise.exercise_type !== "free_form");
}

export async function submitWdExerciseAnswer(
  exerciseId: number,
  body: WdExerciseSubmitRequest
): Promise<WdExerciseSubmitResult> {
  return apiFetch<WdExerciseSubmitResult>(
    `/api/word_detection/exercise/${exerciseId}/submit`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}
