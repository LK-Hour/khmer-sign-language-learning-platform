import {
  buildInitialChapterExpansion as buildInitialChapterExpansionShared,
  mergeUnitsProgress as mergeUnitsProgressShared,
  resolveInitialUnitId as resolveInitialUnitIdShared,
} from "@/features/shared/trackState";

import type { FsTrackChapter, FsTrackUnit } from "./types";
import type { FsLesson } from "../types";

export function resolveInitialUnitId(units: FsTrackUnit[]): number | null {
  return resolveInitialUnitIdShared(units);
}

export function mergeUnitsProgress(
  current: FsTrackUnit[],
  incoming: FsTrackUnit[]
): FsTrackUnit[] {
  return mergeUnitsProgressShared<FsLesson, FsTrackChapter, FsTrackUnit>(
    current,
    incoming
  );
}

export function buildInitialChapterExpansion(
  units: FsTrackUnit[]
): Record<number, boolean> {
  return buildInitialChapterExpansionShared<FsLesson, FsTrackChapter, FsTrackUnit>(
    units
  );
}
