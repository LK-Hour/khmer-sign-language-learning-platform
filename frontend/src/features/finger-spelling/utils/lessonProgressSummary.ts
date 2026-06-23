import type { Locale } from "@/i18n/config";
import type { FsTrackUnit } from "../store/types";
import type { FsUnit } from "../types";
import { toKhmerNumeral } from "./chapter";

type LessonCountSource = Pick<FsUnit, "completedLessonCount" | "totalLessonCount">;

export function sumLessonProgress(units: LessonCountSource[]) {
  return units.reduce(
    (acc, unit) => ({
      completed: acc.completed + unit?.completedLessonCount,
      total: acc.total + unit?.totalLessonCount,
    }),
    { completed: 0, total: 0 }
  );
}

export function formatLessonProgressStat(
  completed: number,
  total: number,
  locale: Locale
): { completed: string; total: string } {
  if (locale === "kh") {
    return {
      completed: toKhmerNumeral(completed),
      total: toKhmerNumeral(total),
    };
  }

  return {
    completed: String(completed),
    total: String(total),
  };
}

export function trackUnitsToCountSources(units: FsTrackUnit[]): LessonCountSource[] {
  return units.map((unit) => ({
    completedLessonCount: unit?.completedLessonCount,
    totalLessonCount: unit?.totalLessonCount,
  }));
}
