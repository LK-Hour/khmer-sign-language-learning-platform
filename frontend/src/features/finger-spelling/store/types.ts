import type { FsChapter, FsLesson, FsLessonDetail, FsUnit } from "../types";

export type FsTrackChapter = FsChapter & {
  lessons: FsLesson[];
};

export type FsTrackUnit = FsUnit & {
  chapters: FsTrackChapter[];
};

export type PracticeContext = {
  lesson: FsLessonDetail;
  unit: FsUnit;
  chapter: FsChapter;
  nextLessonId?: number;
};

export const FS_PASS_THRESHOLD = 50;
