import type { FsProgressStatus } from "./curriculum";

export interface FsLessonProgress {
  lessonId: number;
  progressStatus: FsProgressStatus;
  isLocked: boolean;
  attempts: number;
  totalTimeSpent: number;
  peakAccuracy?: number;
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
}

export interface FsChapterProgressLesson {
  lessonId: number;
  orderIndex: number;
  progressStatus: FsProgressStatus;
  isLocked: boolean;
}

export interface FsChapterProgress {
  chapterId: number;
  completedLessonCount: number;
  totalLessonCount: number;
  isExerciseUnlocked: boolean;
  lessons: FsChapterProgressLesson[];
}
