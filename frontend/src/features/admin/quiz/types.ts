/** Aligns with backend `FsExerciseType` / quiz question `type` */
export type AdminQuizQuestionType =
  | "MULTIPLE_CHOICE"
  | "IMAGE_CHOICE"
  | "TEXT_INPUT";

export interface AdminQuizQuestion {
  id: string;
  chapter_id: string;
  lesson_id: string | null;
  type: AdminQuizQuestionType;
  prompt: string;
  prompt_kh: string;
  image_url: string;
  options: string[];
  correct_answer: string;
  order_index: number;
  is_active: boolean;
}

export interface AdminQuizMockContext {
  track: string;
  unit: { id: string; title: string; title_kh: string };
  chapter: { id: string; title: string; title_kh: string };
  lessons: { id: string; title: string }[];
}
