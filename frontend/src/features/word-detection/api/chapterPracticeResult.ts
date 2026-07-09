import type {
  WdChapterPracticeResultRequest,
  WdChapterPracticeResultResponse,
} from "../types";
import { apiFetch } from "@/utils/api/client";

export async function submitWdChapterPracticeResult(
  chapterId: number,
  body: WdChapterPracticeResultRequest
): Promise<WdChapterPracticeResultResponse | null> {
  try {
    return await apiFetch<WdChapterPracticeResultResponse>(
      `/api/word_detection/chapters/${chapterId}/practice/result`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
  } catch {
    return null;
  }
}
