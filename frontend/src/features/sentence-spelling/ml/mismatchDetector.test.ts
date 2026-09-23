import { describe, expect, it } from "vitest";

import {
  createMismatchDetector,
  isWrongSign,
  type MismatchDetectorConfig,
  type MismatchInput,
} from "./mismatchDetector";

const config: MismatchDetectorConfig = {
  holdFrames: 3,
  minConfidence: 75,
  cooldownMs: 2000,
  graceMs: 1000,
};

const wrong: MismatchInput = { label: "ខ", confidence: 90, labelMatches: false, handDetected: true };
const right: MismatchInput = { label: "ក", confidence: 90, labelMatches: true, handDetected: true };
// What the model really returns for the all-zero vector sent when no hand is in frame.
const noHandGuess: MismatchInput = { label: "ឫ", confidence: 68.8, labelMatches: false, handDetected: false };

/** Feeds `input` `count` times, 100 ms apart, and returns how many fails fired. */
function feed(
  detector: ReturnType<typeof createMismatchDetector>,
  input: MismatchInput,
  count: number,
  startAt: number
) {
  let fails = 0;
  for (let frame = 0; frame < count; frame += 1) {
    if (detector.update(input, startAt + frame * 100)) fails += 1;
  }
  return fails;
}

describe("isWrongSign", () => {
  it("is true only for a confident, real sign that doesn't match", () => {
    expect(isWrongSign(wrong, 60)).toBe(true);
    expect(isWrongSign(right, 60)).toBe(false);
    expect(isWrongSign({ ...wrong, labelMatches: null }, 60)).toBe(false);
  });

  it("ignores low-confidence guesses", () => {
    expect(isWrongSign({ ...wrong, confidence: 59 }, 60)).toBe(false);
    expect(isWrongSign({ ...wrong, confidence: 60 }, 60)).toBe(true);
  });

  it("ignores no-hand and pseudo labels — nothing was signed wrongly", () => {
    for (const label of [null, "", "No Action", "No_Action", "none", "question"]) {
      expect(isWrongSign({ ...wrong, label, confidence: 95 }, 60)).toBe(false);
    }
  });

  it("ignores the model's guess when no hand is in frame, however confident", () => {
    expect(isWrongSign(noHandGuess, 60)).toBe(false);
    expect(isWrongSign({ ...wrong, handDetected: false, confidence: 100 }, 60)).toBe(false);
  });
});

describe("createMismatchDetector", () => {
  it("reports a fail once a wrong sign has been held long enough", () => {
    const detector = createMismatchDetector(config);
    detector.reset(0);

    expect(feed(detector, wrong, 2, 2000)).toBe(0);
    expect(detector.update(wrong, 2200)).toBe(true);
  });

  it("restarts the count whenever the wrong sign is interrupted", () => {
    const detector = createMismatchDetector(config);
    detector.reset(0);

    feed(detector, wrong, 2, 2000);
    detector.update(right, 2200);
    expect(feed(detector, wrong, 2, 2300)).toBe(0);
  });

  it("does not report a fail for a correct sign or a 'No Action' prediction", () => {
    const detector = createMismatchDetector(config);
    detector.reset(0);

    expect(feed(detector, right, 10, 2000)).toBe(0);
    expect(feed(detector, { ...wrong, label: "No Action", confidence: 0 }, 10, 3000)).toBe(0);
  });

  it("never reports a fail while no hand is in frame", () => {
    const detector = createMismatchDetector(config);
    detector.reset(0);

    // Far longer than the hold time and the grace period.
    expect(feed(detector, noHandGuess, 100, 2000)).toBe(0);
  });

  it("does not count the frames before and after the hand leaves as one held sign", () => {
    const detector = createMismatchDetector(config);
    detector.reset(0);

    feed(detector, wrong, 2, 2000);
    feed(detector, noHandGuess, 1, 2200); // hand drops out of frame
    expect(feed(detector, wrong, 2, 2300)).toBe(0);
  });

  it("waits out the cooldown before reporting another fail", () => {
    const detector = createMismatchDetector(config);
    detector.reset(0);

    expect(feed(detector, wrong, 3, 2000)).toBe(1); // fires at t = 2200
    // Still held, 100 ms apart — inside the cooldown, so silent.
    expect(feed(detector, wrong, 10, 2300)).toBe(0);
    // Once the cooldown has passed, a wrong sign that is still held fires again.
    expect(feed(detector, wrong, 3, 2200 + config.cooldownMs + 100)).toBe(1);
  });

  it("stays quiet during the grace period after a new target, then fires if still wrong", () => {
    const detector = createMismatchDetector(config);
    detector.reset(5000); // new character appears; quiet until t = 6000

    expect(feed(detector, wrong, 5, 5000)).toBe(0);
    expect(detector.update(wrong, 6100)).toBe(true);
  });
});
