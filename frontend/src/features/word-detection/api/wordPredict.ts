import { useAuthStore } from "@/store/auth.store";
import { apiFetch } from "@/utils/api/client";
import { getOrCreateLocalGuestId } from "@/utils/localGuest";

export type WordPredictResponse = {
  match_confidence: number;
  predicted_class_index: number;
  predicted_label?: string | null;
  probabilities: number[];
};

function guestHeaders(): HeadersInit | undefined {
  if (!useAuthStore.getState().user?.is_guest) return undefined;
  return {
    "X-KSL-Guest-Id": getOrCreateLocalGuestId(),
  };
}

export async function predictWordFromFeatures(
  features: number[],
): Promise<WordPredictResponse> {
  return apiFetch<WordPredictResponse>(
    "/api/word_detection/practice/predict/features",
    {
      method: "POST",
      headers: guestHeaders(),
      body: JSON.stringify({ features }),
    },
  );
}

export async function fetchWordPredictStatus(): Promise<{
  available: boolean;
  model_loaded: boolean;
}> {
  return apiFetch("/api/word_detection/practice/predict/status", {
    headers: guestHeaders(),
  });
}
