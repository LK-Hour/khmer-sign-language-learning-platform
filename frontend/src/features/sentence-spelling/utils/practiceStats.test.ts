import { describe, expect, it } from "vitest";

import {
  computeAverageAccuracy,
  secondsPerSign,
  skipLabelKey,
  splitElapsed,
} from "./practiceStats";

describe("computeAverageAccuracy", () => {
  it("averages confidence across all characters", () => {
    const confidences = new Map([
      [0, 100],
      [1, 90],
    ]);
    expect(computeAverageAccuracy(confidences, 2)).toBe(95);
  });

  it("counts skipped / missing characters as 0", () => {
    const confidences = new Map([[0, 80]]);
    expect(computeAverageAccuracy(confidences, 4)).toBe(20);
  });

  it("returns 0 when nothing was confirmed or the sentence is empty", () => {
    expect(computeAverageAccuracy(new Map(), 3)).toBe(0);
    expect(computeAverageAccuracy(new Map(), 0)).toBe(0);
  });
});

describe("splitElapsed", () => {
  it("splits 74 seconds into 1m 14s", () => {
    expect(splitElapsed(74_000)).toEqual({ hours: 0, minutes: 1, seconds: 14 });
  });

  it("keeps sub-minute durations as seconds only", () => {
    expect(splitElapsed(42_000)).toEqual({ hours: 0, minutes: 0, seconds: 42 });
  });

  it("splits hour-long sessions", () => {
    expect(splitElapsed(3_725_000)).toEqual({ hours: 1, minutes: 2, seconds: 5 });
  });

  it("rounds to the nearest second and never goes negative", () => {
    expect(splitElapsed(1_499)).toEqual({ hours: 0, minutes: 0, seconds: 1 });
    expect(splitElapsed(-50)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });
});

describe("secondsPerSign", () => {
  it("divides elapsed time by the sign count", () => {
    expect(secondsPerSign(74_000, 18).toFixed(1)).toBe("4.1");
  });

  it("returns 0 for an empty sentence", () => {
    expect(secondsPerSign(5_000, 0)).toBe(0);
  });
});

describe("skipLabelKey", () => {
  it("uses the singular for 0 and 1 skips", () => {
    expect(skipLabelKey(0)).toBe("SENTENCE_SPELLING.PRACTICE.STATS.SKIP_SINGULAR");
    expect(skipLabelKey(1)).toBe("SENTENCE_SPELLING.PRACTICE.STATS.SKIP_SINGULAR");
  });

  it("uses the plural for more than one skip", () => {
    expect(skipLabelKey(2)).toBe("SENTENCE_SPELLING.PRACTICE.STATS.SKIP_PLURAL");
    expect(skipLabelKey(18)).toBe("SENTENCE_SPELLING.PRACTICE.STATS.SKIP_PLURAL");
  });
});
