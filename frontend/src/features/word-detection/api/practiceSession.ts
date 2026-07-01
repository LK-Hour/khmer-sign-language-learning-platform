import { apiFetch } from "@/utils/api/client";
import type {
  WdPracticeAttemptRequest,
  WdPracticeAttemptResponse,
} from "../types";

export async function submitWdPracticeAttempt(
  lessonId: number,
  body: WdPracticeAttemptRequest = {}
): Promise<WdPracticeAttemptResponse> {
  return apiFetch<WdPracticeAttemptResponse>(
    `/api/word_detection/progress/lessons/${lessonId}/practice`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}
