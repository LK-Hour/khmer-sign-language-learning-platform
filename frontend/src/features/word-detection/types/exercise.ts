export type WdExerciseType = "multiple_choice" | "image_select" | "matching";

export interface WdExerciseMediaData {
  id: number;
  file_url: string;
  media_type: "video" | "gif" | "image";
}

export interface WdExerciseOptionData {
  id: number;
  option_text_en: string | null;
  option_text_kh: string | null;
  order_index: number;
  media: WdExerciseMediaData | null;
}

export interface WdExerciseQuestionData {
  id: number;
  lesson_id: number;
  question_en: string;
  question_kh: string;
  exercise_type: WdExerciseType | "free_form";
  order_index: number;
  options: WdExerciseOptionData[];
  media: WdExerciseMediaData | null;
}

export interface WdExerciseSubmitRequest {
  selected_option_id?: number | null;
  selected_answer?: string | null;
  time_taken?: number;
}

export interface WdExerciseSubmitResult {
  is_correct: boolean;
  attempt_number: number;
  lesson_id: number;
  progress_id: string;
  explanation_en: string | null;
  explanation_kh: string | null;
}
