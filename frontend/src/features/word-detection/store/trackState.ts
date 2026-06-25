import type { WdTrackUnit } from "./types";

export function resolveInitialUnitId(units: WdTrackUnit[]): number | null {
  return units.find((unit) => !unit?.isLocked)?.id ?? units[0]?.id ?? null;
}

export function buildInitialChapterExpansion(
  units: WdTrackUnit[]
): Record<number, boolean> {
  const expanded: Record<number, boolean> = {};

  for (const unit of units) {
    const firstChapter = [...unit?.chapters].sort(
      (a, b) => a?.orderIndex - b?.orderIndex
    )[0];
    if (firstChapter && !firstChapter?.isLocked) {
      expanded[firstChapter?.id] = true;
    }
  }

  return expanded;
}
