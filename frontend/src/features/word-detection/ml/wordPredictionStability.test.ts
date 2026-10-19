import { describe, expect, it } from "vitest";
import { WordPredictionStability } from "./wordPredictionStability";
const sample = (seq: number, sampledAt: number, label = "hello", confidence = 90) => ({ seq, sampledAt, label, confidence });
describe("word stability", () => {
  it("accepts two stable independent samples on a slow connection", () => {
    const tracker = new WordPredictionStability();
    expect(tracker.accept(sample(1, 100))).toBe(false);
    expect(tracker.accept(sample(1, 1000))).toBe(false);
    expect(tracker.accept(sample(2, 700))).toBe(true);
  });
  it("requires a time window on a fast connection", () => {
    const tracker = new WordPredictionStability();
    expect(tracker.accept(sample(1, 100))).toBe(false);
    expect(tracker.accept(sample(2, 200))).toBe(false);
    expect(tracker.accept(sample(3, 400))).toBe(true);
  });
  it.each([sample(2, 500, "other"), sample(2, 500, "No Action"), sample(2, 500, "hello", 20)])("resets on changed or unreliable evidence: %o", (middle) => {
    const tracker = new WordPredictionStability();
    tracker.accept(sample(1, 100));
    expect(tracker.accept(middle)).toBe(false);
    expect(tracker.accept(sample(3, 600))).toBe(false);
  });
  it("does not carry evidence across retries or long pauses", () => {
    const tracker = new WordPredictionStability();
    tracker.accept(sample(1, 100));
    expect(tracker.accept(sample(2, 6000))).toBe(false);
    tracker.reset();
    expect(tracker.accept(sample(3, 6500))).toBe(false);
  });
});
