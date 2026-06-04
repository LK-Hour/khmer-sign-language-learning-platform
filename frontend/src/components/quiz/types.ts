export type QuizQuestionType =
  | "MULTIPLE_CHOICE"
  | "FREE_INPUT"
  | "IMAGE_SELECT";

export interface QuizOption {
  id: string;
  letter: string;
  romanization?: string;
  imageUrl?: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  promptImageUrl?: string;
  promptText?: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface QuizResult {
  score: number;
  maxScore: number;
  passed: boolean;
}
