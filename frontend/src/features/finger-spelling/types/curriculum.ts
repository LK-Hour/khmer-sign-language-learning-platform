export type FsProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface FsUnit {
  id: number;
  title: string;
  titleKh: string;
  category?: string | null;
  orderIndex: number;
  chapterCount: number;
  completedLessonCount: number;
  totalLessonCount: number;
  isLocked?: boolean;
}

export interface FsChapter {
  id: number;
  unitId: number;
  title: string;
  titleKh: string;
  description?: string | null;
  descriptionKh?: string | null;
  orderIndex: number;
  lessonCount: number;
  completedLessonCount: number;
  isExerciseUnlocked: boolean;
  isLocked?: boolean;
}

export interface FsLesson {
  id: number;
  chapterId: number;
  letter: string;
  romanization?: string | null;
  letterNameEn?: string | null;
  letterNameKh?: string | null;
  imageUrl: string;
  orderIndex: number;
  isLocked: boolean;
  progressStatus: FsProgressStatus;
  /** 0–100; falls back from progressStatus when omitted */
  progressPercent?: number;
}

export interface FsLessonDetail extends FsLesson {
  description?: string | null;
  descriptionKh?: string | null;
}
