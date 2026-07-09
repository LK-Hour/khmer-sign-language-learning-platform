export interface WdPracticeItem {
  lessonId: number;
  wordId: number;
  wordKh: string;
  wordEn?: string | null;
  orderIndex: number;
  practiceImageUrl: string;
}

export interface WdChapterPractice {
  chapterId: number;
  chapterTitle: string;
  chapterTitleKh: string;
  unitId: number;
  unitTitle: string;
  unitTitleKh: string;
  isUnlocked: boolean;
  practiceId: number | null;
  items: WdPracticeItem[];
  isComplete: boolean;
  attempts: number;
  avgScore: number;
}

export interface WdChapterPracticeResultRequest {
  avgScore: number;
  isComplete: boolean;
}

export interface WdChapterPracticeResultResponse {
  chapterId: number;
  practiceId: number;
  avgScore: number;
  isComplete: boolean;
  attempts: number;
}
