import { apiFetch } from "@/utils/api/client";

export type FeedbackMood =
  | "very_bad"
  | "bad"
  | "okay"
  | "good"
  | "excellent";

export type FeedbackType = "finger_spelling" | "words";

export type LessonFeedbackResponse = {
  id: number;
  type: FeedbackType;
  category: string;
  lesson_id: number;
  characteristic: string;
  mood: FeedbackMood;
  comment: string | null;
  created_at: string;
};

export async function submitLessonFeedback(data: {
  type: FeedbackType;
  category: string;
  lesson_id: number;
  characteristic: string;
  mood: FeedbackMood;
  comment?: string;
}): Promise<LessonFeedbackResponse> {
  return apiFetch<LessonFeedbackResponse>("/api/feedback", {
    method: "POST",
    body: JSON.stringify({
      type: data?.type,
      category: data?.category,
      lesson_id: data?.lesson_id,
      characteristic: data?.characteristic,
      mood: data?.mood,
      comment: data?.comment?.trim() || undefined,
    }),
  });
}