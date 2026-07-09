import { useAuthStore } from "@/store/auth.store";
import { apiFetch } from "@/utils/api/client";
import { getOrCreateLocalGuestId } from "@/utils/localGuest";

export type WdContributionUploadResponse = {
  id: string;
  media_id: number;
  file_url: string;
  status: "pending" | string;
};

type SubmitWdRecordingInput = {
  video: Blob;
  lessonId: number;
  word: string;
  predictedLabel: string;
  confidence: number;
};

function contributionHeaders(): HeadersInit | undefined {
  const { user, token } = useAuthStore.getState();
  if (token && !user?.is_guest) return undefined;
  return {
    "X-KSL-Guest-Id": getOrCreateLocalGuestId(),
  };
}

function extensionForBlob(blob: Blob): string {
  const type = blob.type.toLowerCase();
  if (type.includes("mp4")) return "mp4";
  if (type.includes("quicktime")) return "mov";
  return "webm";
}

export async function submitWdRecording({
  video,
  lessonId,
  word,
  predictedLabel,
  confidence,
}: SubmitWdRecordingInput): Promise<WdContributionUploadResponse> {
  const formData = new FormData();
  formData.append("video", video, `${word}-contribution.${extensionForBlob(video)}`);
  formData.append("lesson_id", String(lessonId));
  formData.append("word", word);
  formData.append("predicted_label", predictedLabel);
  formData.append("confidence", String(confidence));

  return apiFetch<WdContributionUploadResponse>("/api/word_detection/contributions", {
    method: "POST",
    headers: contributionHeaders(),
    body: formData,
  });
}
