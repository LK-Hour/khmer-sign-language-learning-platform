import { apiFetch } from "@/utils/api/client";
import type {
  PracticeAccuracyResponse,
  PracticeEndResponse,
  PracticeLetterSubmitRequest,
  PracticeLetterSubmitResponse,
  PracticeSessionResponse,
  PracticeSessionStartRequest,
} from "../types";

export async function startPracticeSession(
  lessonId: number,
  body: PracticeSessionStartRequest = {}
): Promise<PracticeSessionResponse> {
  return apiFetch<PracticeSessionResponse>(
    `/api/finger_spelling/practice/lessons/${lessonId}/sessions`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function submitPracticeLetter(
  sessionId: number,
  body: PracticeLetterSubmitRequest
): Promise<PracticeLetterSubmitResponse> {
  return apiFetch<PracticeLetterSubmitResponse>(
    `/api/finger_spelling/practice/sessions/${sessionId}/letters`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function endPracticeSession(
  sessionId: number
): Promise<PracticeEndResponse> {
  return apiFetch<PracticeEndResponse>(
    `/api/finger_spelling/practice/sessions/${sessionId}/end`,
    { method: "POST" }
  );
}

export async function fetchPracticeAccuracy(
  sessionId: number
): Promise<PracticeAccuracyResponse> {
  return apiFetch<PracticeAccuracyResponse>(
    `/api/finger_spelling/practice/sessions/${sessionId}/accuracy`
  );
}
