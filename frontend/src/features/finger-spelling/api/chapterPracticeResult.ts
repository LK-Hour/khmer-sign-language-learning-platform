import type {
  ChapterPracticeResultRequest,
  ChapterPracticeResultResponse,
} from "../types";
import { apiFetch } from "@/utils/api/client";

export async function submitChapterPracticeResult(
  chapterId: number,
  body: ChapterPracticeResultRequest
): Promise<ChapterPracticeResultResponse | null> {
  try {
    const result = await apiFetch<ChapterPracticeResultResponse>(
      `/api/finger_spelling/chapters/${chapterId}/practice/result`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return result;
  } catch {
    return null;
  }
}
