import { describe, expect, it } from "vitest";
import { labelsMatch } from "./usePredictionRetry";

describe("labelsMatch", () => {
  it("matches identical labels", () => {
    expect(labelsMatch("អ", "អ")).toBe(true);
  });

  it("does not match unrelated labels", () => {
    expect(labelsMatch("អ", "ក")).toBe(false);
  });

  it("returns false when either label is null/undefined", () => {
    expect(labelsMatch(null, "អ")).toBe(false);
    expect(labelsMatch("អ", null)).toBe(false);
    expect(labelsMatch(undefined, undefined)).toBe(false);
  });

  it("normalizes No_Action variants", () => {
    expect(labelsMatch("No_Action", "no action")).toBe(true);
  });

  it("treats the model's canonical prediction for ឣ as a match", () => {
    // ឣ (id=114) shares its hand shape with អ (id=56); the model can only
    // ever predict "អ", so a lesson targeting ឣ must still accept it.
    expect(labelsMatch("អ", "ឣ")).toBe(true);
  });

  it("does not let the alias leak into unrelated comparisons", () => {
    expect(labelsMatch("ក", "ឣ")).toBe(false);
    expect(labelsMatch("ឣ", "ក")).toBe(false);
  });
});
