import type { WdChapter, WdLesson, WdUnit } from "../types";

export type WdTrackChapter = WdChapter & {
  lessons: WdLesson[];
};

export type WdTrackUnit = WdUnit & {
  chapters: WdTrackChapter[];
};
