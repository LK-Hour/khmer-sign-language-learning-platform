export interface PracticeSessionStartRequest {
  media_id?: number;
}

export interface PracticeSessionResponse {
  id: number;
  lesson_id: number;
  started_at: string;
  is_completed: boolean;
}

export interface PracticeLetterSubmitRequest {
  letter_id: number;
  accuracy?: number;
  attempts?: number;
  time_spent_seconds?: number;
  media_id?: number;
}

export interface PracticeLetterSubmitResponse {
  session_id: number;
  letter_id: number;
  accuracy?: number;
}

export interface PracticeEndResponse {
  session_id: number;
  lesson_id: number;
  average_accuracy?: number;
  peak_accuracy?: number;
  duration_seconds: number;
  lesson_completed: boolean;
}

export interface PracticeAccuracyResponse {
  session_id: number;
  lesson_id: number;
  average_accuracy?: number;
  peak_accuracy?: number;
  samples: number;
  is_completed: boolean;
}

export interface HandPredictResponse {
  match_confidence: number;
  predicted_class_index: number;
  handedness: string;
}
