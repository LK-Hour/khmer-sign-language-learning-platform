import type {
  QuizOption,
  QuizQuestion,
  QuizQuestionType,
  QuizResult,
} from "@/components/quiz/types";

export type FsQuestionType = QuizQuestionType;
export type FsQuizOption = QuizOption;
export type FsQuizQuestion = QuizQuestion;
export type FsQuizResult = QuizResult;

export interface MediaResponse {
  id: number;
  media_type: "video" | "gif" | "image";
  file_url: string;
  created_at?: string;
  updated_at?: string;
}

export type FsBackendExerciseType =
  | "multiple_choice"
  | "free_form"
  | "image_select"
  | "matching";

export interface FsBackendExerciseOption {
  id: number;
  option_text_en: string | null;
  option_text_kh: string | null;
  media_id: number | null;
  order_index: number;
  media: MediaResponse | null;
}

export interface FsBackendExercise {
  id: number;
  lesson_id: number;
  question_en: string;
  question_kh: string;
  exercise_type: FsBackendExerciseType;
  media_id: number | null;
  order_index: number;
  options: FsBackendExerciseOption[];
  media: MediaResponse | null;
}

export interface FsExercise {
  id: number;
  chapterId: number;
  chapterOrderIndex: number;
  unitId: number;
  unitOrderIndex: number;
  title: string;
  titleKh: string;
  chapterDescription?: string | null;
  chapterDescriptionKh?: string | null;
  isUnlocked: boolean;
  score: number;
  maxScore: number;
}

export interface FsChapterExercise {
  chapterId: number;
  title: string;
  subtitle: string;
  questions: FsQuizQuestion[];
  maxScore: number;
  backendExercises?: FsBackendExercise[];
}

export interface FsQuizSubmitAnswer {
  questionId: string;
  exerciseId?: number;
  selectedOptionId?: string;
  selectedBackendOptionId?: number;
  freeText?: string;
  timeTaken?: number;
}

export interface FsBackendExerciseSubmitRequest {
  selected_option_id?: number;
  selected_answer?: string;
  time_taken?: number;
}

export interface FsBackendExerciseSubmitResponse {
  is_correct: boolean;
  attempt_number: number;
  lesson_id: number;
  progress_id: string;
  explanation_en: string | null;
  explanation_kh: string | null;
}
