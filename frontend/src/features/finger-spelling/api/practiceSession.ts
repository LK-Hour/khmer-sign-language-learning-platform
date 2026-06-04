import type {
  PracticeAccuracyResponse,
  PracticeEndResponse,
  PracticeLetterSubmitRequest,
  PracticeLetterSubmitResponse,
  PracticeSessionResponse,
  PracticeSessionStartRequest,
} from "../types";
import { fsFetch } from "./client";

export async function startPracticeSession(
  lessonId: number,
  body: PracticeSessionStartRequest = {}
): Promise<PracticeSessionResponse> {
  return fsFetch<PracticeSessionResponse>(
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
  return fsFetch<PracticeLetterSubmitResponse>(
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
  return fsFetch<PracticeEndResponse>(
    `/api/finger_spelling/practice/sessions/${sessionId}/end`,
    { method: "POST" }
  );
}

export async function fetchPracticeAccuracy(
  sessionId: number
): Promise<PracticeAccuracyResponse> {
  return fsFetch<PracticeAccuracyResponse>(
    `/api/finger_spelling/practice/sessions/${sessionId}/accuracy`
  );
}
