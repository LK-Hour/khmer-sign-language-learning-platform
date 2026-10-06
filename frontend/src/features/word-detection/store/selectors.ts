import { findCurrentUnit, findResumeLesson } from "@/features/shared/trackProgress";
import type { WordDetectionState } from "./wordDetection.store";

export function selectResumeLesson(state: WordDetectionState) {
  return findResumeLesson(state.units);
}

export function selectCurrentUnit(state: WordDetectionState) {
  return findCurrentUnit(state.units);
}
