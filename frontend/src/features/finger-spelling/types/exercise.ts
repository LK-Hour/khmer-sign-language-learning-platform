export type ExerciseQuestionType =
  | "multiple_choice"
  | "true_false"
  | "multiple_answer"
  | "matching";

export interface ExerciseOptionData {
  id: number;
  option_text_en: string | null;
  option_text_kh: string | null;
  media_url: string | null;
  is_correct: boolean;
  order_index: number;
}

export interface ExerciseQuestionData {
  exercise_id: number;
  exercise_type: ExerciseQuestionType;
  question_en: string;
  question_kh: string;
  media_url: string | null;
  options: ExerciseOptionData[];
}

export interface ExerciseAnswerResultData {
  exercise_id: number;
  is_correct: boolean;
  score: number;
  selected_option_ids: number[];
  correct_option_ids: number[];
  matching_pairs: Record<string, number> | null;
}

export interface ExerciseSessionData {
  attempt_id: string;
  unit_id: number;
  questions: ExerciseQuestionData[];
  is_completed: boolean;
  score: number;
  max_score: number;
  per_question_results: ExerciseAnswerResultData[];
}

export interface ExerciseAnswerSubmit {
  exercise_id: number;
  selected_option_ids: number[];
  matching_pairs: Record<string, number> | null;
}

export interface ExerciseSubmitRequest {
  attempt_id: string;
  answers: ExerciseAnswerSubmit[];
}
