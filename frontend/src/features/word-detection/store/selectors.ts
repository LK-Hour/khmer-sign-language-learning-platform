import { findCurrentUnit, findResumeLesson } from "../utils/progress";
import type { WordDetectionState } from "./wordDetection.store";

export function selectResumeLesson(state: WordDetectionState) {
  return findResumeLesson(state.units);
}

export function selectCurrentUnit(state: WordDetectionState) {
  return findCurrentUnit(state.units);
}
