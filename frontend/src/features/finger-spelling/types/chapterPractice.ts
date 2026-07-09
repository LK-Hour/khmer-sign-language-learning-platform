export interface FsPracticeItem {
  lessonId: number;
  letterId: number;
  letterKh: string;
  letterEn?: string | null;
  orderIndex: number;
  practiceImageUrl: string;
}

export interface FsChapterPractice {
  chapterId: number;
  chapterTitle: string;
  chapterTitleKh: string;
  unitId: number;
  unitTitle: string;
  unitTitleKh: string;
  isUnlocked: boolean;
  practiceId: number | null;
  items: FsPracticeItem[];
  isComplete: boolean;
  attempts: number;
  avgScore: number;
}

export interface ChapterPracticeResultRequest {
  avgScore: number;
  isComplete: boolean;
}

export interface ChapterPracticeResultResponse {
  chapterId: number;
  practiceId: number;
  avgScore: number;
  isComplete: boolean;
  attempts: number;
}
