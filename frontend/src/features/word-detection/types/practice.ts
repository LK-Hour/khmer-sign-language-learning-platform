export interface WdPracticeAttemptRequest {
  accuracy?: number | null;
}

export interface WdPracticeAttemptResponse {
  lesson_id: number;
  accuracy?: number;
  lesson_completed: boolean;
}
