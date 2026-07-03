import { apiFetch } from "@/utils/api/client";
import { useAuthStore } from "@/store/auth.store";
import { getOrCreateLocalGuestId } from "@/utils/localGuest";
import type { HandPredictResponse } from "../types";

function guestHeaders(): HeadersInit | undefined {
  if (!useAuthStore.getState().user?.is_guest) return undefined;
  return {
    "X-KSL-Guest-Id": getOrCreateLocalGuestId(),
  };
}

export async function predictHandFromFeatures(
  features: number[],
  handedness?: string,
  category?: string,
  targetLabel?: string,
): Promise<HandPredictResponse> {
  return apiFetch<HandPredictResponse>(
    "/api/finger_spelling/practice/predict/features",
    {
      method: "POST",
      headers: guestHeaders(),
      body: JSON.stringify({
        features,
        handedness,
        category,
        target_label: targetLabel,
      }),
    }
  );
}

export async function fetchHandPredictStatus(): Promise<{
  available: boolean;
  model_loaded: boolean;
}> {
  return apiFetch("/api/finger_spelling/practice/predict/status", {
    headers: guestHeaders(),
  });
}
