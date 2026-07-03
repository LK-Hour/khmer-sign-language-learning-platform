/** Types mirroring the centralized admin API (/api/admin/{track}/...). */

export type AdminTrack = "finger" | "word_detection";

export type PublishStatus = "draft" | "published";

interface AdminContentBase {
  id: number;
  name_en: string;
  name_kh: string;
  description_en: string | null;
  description_kh: string | null;
  order_index: number;
  is_active: boolean;
  publish_status: PublishStatus;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminUnit extends AdminContentBase {
  chapter_count: number;
}

export interface AdminChapter extends AdminContentBase {
  unit_id: number;
  level: number | null;
  lesson_count: number;
  exercise_count: number;
}

export interface AdminLesson extends AdminContentBase {
  chapter_id: number;
  exercise_count: number;
}

export type AdminEntity = AdminUnit | AdminChapter | AdminLesson;

export interface AdminUnitPayload {
  name_en: string;
  name_kh: string;
  description_en?: string | null;
  description_kh?: string | null;
  order_index: number;
}

export interface AdminChapterPayload extends AdminUnitPayload {
  unit_id: number;
  level?: number;
}

export interface AdminLessonPayload extends AdminUnitPayload {
  chapter_id: number;
}

export interface AdminExerciseOption {
  id: number;
  exercise_id: number;
  option_text_en: string | null;
  option_text_kh: string | null;
  media_id: number | null;
  is_correct: boolean;
  is_active: boolean;
  points: number;
  order_index: number;
}

export interface AdminExercise {
  id: number;
  lesson_id: number;
  question_en: string;
  question_kh: string;
  exercise_type: string;
  media_id: number | null;
  correct_answer: string | null;
  explanation_en: string | null;
  explanation_kh: string | null;
  order_index: number;
  is_active: boolean;
  publish_status: PublishStatus;
  published_at: string | null;
  options: AdminExerciseOption[];
}

export interface AdminExerciseOptionPayload {
  option_text_en?: string | null;
  option_text_kh?: string | null;
  is_correct?: boolean;
  points?: number;
  order_index?: number;
}

export interface AdminExercisePayload {
  lesson_id: number;
  question_en: string;
  question_kh: string;
  exercise_type: string;
  correct_answer?: string | null;
  explanation_en?: string | null;
  explanation_kh?: string | null;
  order_index: number;
  options?: AdminExerciseOptionPayload[];
}

export const EXERCISE_TYPES = [
  "multiple_choice",
  "free_form",
  "image_select",
  "matching",
] as const;
