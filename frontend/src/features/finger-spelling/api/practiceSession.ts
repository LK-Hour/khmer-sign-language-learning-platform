import { apiFetch } from "@/utils/api/client";
import type {
  PracticeAttemptRequest,
  PracticeAttemptResponse,
} from "../types";

export async function submitPracticeAttempt(
  lessonId: number,
  body: PracticeAttemptRequest = {}
): Promise<PracticeAttemptResponse> {
  return apiFetch<PracticeAttemptResponse>(
    `/api/finger_spelling/practice/lessons/${lessonId}/attempt`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}