import type { HandPredictResponse } from "../types";
import { fsFetch } from "./client";

export async function predictHandFromFeatures(
  features: number[],
  handedness?: string
): Promise<HandPredictResponse> {
  return fsFetch<HandPredictResponse>(
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
  return fsFetch("/api/finger_spelling/practice/predict/status");
}
