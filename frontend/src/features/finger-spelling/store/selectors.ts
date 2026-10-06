import { findCurrentUnit, findResumeLesson } from "@/features/shared/trackProgress";
import type { FingerSpellingState } from "./fingerSpelling.store";

export function selectResumeLesson(state: FingerSpellingState) {
  return findResumeLesson(state.units);
}

export function selectCurrentUnit(state: FingerSpellingState) {
  return findCurrentUnit(state.units);
}
