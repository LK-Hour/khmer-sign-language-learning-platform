export interface PracticeAttemptRequest {
  accuracy?: number | null;
}

export interface PracticeAttemptResponse {
  lesson_id: number;
  accuracy?: number;
  lesson_completed: boolean;
}

export interface HandPredictResponse {
  match_confidence: number;
  predicted_class_index: number;
  predicted_label?: string | "";
  handedness: string;
}
