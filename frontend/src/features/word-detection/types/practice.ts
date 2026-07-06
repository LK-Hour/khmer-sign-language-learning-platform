export interface WdPracticeAttemptRequest {
  accuracy?: number | null;
  label_matched?: boolean;
}

export interface WdPracticeAttemptResponse {
  lesson_id: number;
  accuracy?: number;
  lesson_completed: boolean;
}
