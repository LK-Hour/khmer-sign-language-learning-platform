import {
  buildInitialChapterExpansion as buildInitialChapterExpansionShared,
  mergeUnitsProgress as mergeUnitsProgressShared,
  resolveInitialUnitId as resolveInitialUnitIdShared,
} from "@/features/shared/trackState";

import type { WdTrackChapter, WdTrackUnit } from "./types";
import type { WdLesson } from "../types";

export function resolveInitialUnitId(units: WdTrackUnit[]): number | null {
  return resolveInitialUnitIdShared(units);
}

export function mergeUnitsProgress(
  current: WdTrackUnit[],
  incoming: WdTrackUnit[]
): WdTrackUnit[] {
  return mergeUnitsProgressShared<WdLesson, WdTrackChapter, WdTrackUnit>(
    current,
    incoming
  );
}

export function buildInitialChapterExpansion(
  units: WdTrackUnit[]
): Record<number, boolean> {
  return buildInitialChapterExpansionShared<WdLesson, WdTrackChapter, WdTrackUnit>(
    units,
    { skipLockedFirstChapter: true }
  );
}
