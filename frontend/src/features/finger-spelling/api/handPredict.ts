import { apiFetch } from "@/utils/api/client";
import type { HandPredictResponse } from "../types";

export async function predictHandFromFeatures(
  features: number[],
  handedness?: string
): Promise<HandPredictResponse> {
  return apiFetch<HandPredictResponse>(
    "/api/finger_spelling/practice/predict/features",
    {
      method: "POST",
      body: JSON.stringify({
        features,
        handedness,
      }),
    }
  );
}

export async function fetchHandPredictStatus(): Promise<{
  available: boolean;
  model_loaded: boolean;
}> {
  return apiFetch("/api/finger_spelling/practice/predict/status");
}
