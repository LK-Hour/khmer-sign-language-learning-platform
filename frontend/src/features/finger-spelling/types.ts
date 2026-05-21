export type FsProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface FsUnit {
  id: number;
  title: string;
  titleKh: string;
  category?: string;
  orderIndex: number;
  chapterCount: number;
  completedLessonCount: number;
  totalLessonCount: number;
}

export interface FsChapter {
  id: number;
  unitId: number;
  title: string;
  titleKh: string;
  description?: string;
  descriptionKh?: string;
  orderIndex: number;
  lessonCount: number;
  completedLessonCount: number;
  isQuizUnlocked: boolean;
}

export interface FsLesson {
  id: number;
  chapterId: number;
  letter: string;
  romanization?: string;
  letterNameEn?: string;
  letterNameKh?: string;
  imageUrl: string;
  orderIndex: number;
  isLocked: boolean;
  progressStatus: FsProgressStatus;
}

export interface FsLessonDetail extends FsLesson {
  description?: string;
  descriptionKh?: string;
}
