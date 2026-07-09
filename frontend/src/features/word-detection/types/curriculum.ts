export type WdProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface WdUnit {
  id: number;
  title: string;
  titleKh: string;
  category?: string | null;
  categoryKh?: string | null;
  orderIndex: number;
  chapterCount: number;
  completedLessonCount: number;
  totalLessonCount: number;
  isLocked?: boolean;
}

export interface WdChapter {
  id: number;
  unitId: number;
  title: string;
  titleKh: string;
  description?: string | null;
  descriptionKh?: string | null;
  orderIndex: number;
  lessonCount: number;
  completedLessonCount: number;
  isLocked?: boolean;
  isPracticeUnlocked?: boolean;
  isPracticeComplete?: boolean;
}

/**
 * One lesson = one Khmer word class from the dataset.
 * Mirrors FsLesson: each row on the track teaches a single sign target.
 */
export interface WdLesson {
  id: number;
  chapterId: number;
  word: string;      // Khmer label — matches the dataset folder name
  wordEn: string;    // English translation
  videoUrl: string;  // sample sign video URL (resolved from backend media)
  orderIndex: number;
  isLocked: boolean;
  progressStatus: WdProgressStatus;
  progressPercent?: number;
}

export interface WdLessonDetail extends WdLesson {
  description?: string | null;
  descriptionKh?: string | null;
}
