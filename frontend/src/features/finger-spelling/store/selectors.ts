import { findResumeLesson } from "../utils/progress";
import type { FingerSpellingState } from "./fingerSpelling.store";

export function selectResumeLesson(state: FingerSpellingState) {
  return findResumeLesson(state.units);
}

export function selectCurrentUnit(state: FingerSpellingState) {
  const { units, expandedUnitId } = state;
  return (
    units.find((unit) => unit.id === expandedUnitId) ??
    units.find((unit) => !unit.isLocked) ??
    units[0]
  );
}
