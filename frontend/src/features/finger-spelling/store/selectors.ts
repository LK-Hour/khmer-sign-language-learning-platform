import { findCurrentUnit, findResumeLesson } from "../utils/progress";
import type { FingerSpellingState } from "./fingerSpelling.store";

export function selectResumeLesson(state: FingerSpellingState) {
  return findResumeLesson(state.units);
}

export function selectCurrentUnit(state: FingerSpellingState) {
  return findCurrentUnit(state.units);
}
