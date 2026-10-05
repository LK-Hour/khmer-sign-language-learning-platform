import { describe, expect, it } from "vitest";
import {
  WORD_FRAME_INTERVAL_MS,
  WORD_RAW_FRAME_FEATURES,
  WORD_SEQUENCE_LENGTH,
  buildRawFrame,
  pruneHistory,
  resampleSequence,
  type TimedFrame,
} from "./wordSequence";

const frameWith = (value: number): Float32Array => new Float32Array(WORD_RAW_FRAME_FEATURES).fill(value);
const row = (seq: Float32Array, k: number) => seq[k * WORD_RAW_FRAME_FEATURES];

describe("buildRawFrame", () => {
  it("lays out pose, left hand, right hand and zero-fills what is missing", () => {
    const point = (v: number) => ({ x: v, y: v + 0.1, z: v + 0.2, visibility: 0.9 });
    const hand = (v: number) => Array.from({ length: 21 }, () => point(v));
    const frame = buildRawFrame([point(1)], hand(2), undefined);

    expect(Array.from(frame.slice(0, 4))).toEqual([1, 1.100000023841858, 1.2000000476837158, 0.8999999761795685].map(Math.fround));
    expect(frame[132]).toBe(2);
    expect(frame[195]).toBe(0);
    expect(frame).toHaveLength(258);
  });
});

describe("resampleSequence", () => {
  it("returns null with no frames", () => {
    expect(resampleSequence([])).toBeNull();
  });

  it("outputs 30 frames ending at the newest and pads before the first", () => {
    const seq = resampleSequence([{ time: 1000, values: frameWith(0.5) }])!;
    expect(seq).toHaveLength(WORD_SEQUENCE_LENGTH * WORD_RAW_FRAME_FEATURES);
    expect(row(seq, 0)).toBeCloseTo(0.5);
    expect(row(seq, 29)).toBeCloseTo(0.5);
  });

  it("interpolates a slow (10 fps) source onto the 30 fps grid", () => {
    const frames: TimedFrame[] = Array.from({ length: 12 }, (_, i) => ({ time: i * 100, values: frameWith(0.1 * (i + 1)) }));
    const seq = resampleSequence(frames)!;
    const step = row(seq, 29) - row(seq, 28);
    // 0.1 per 100 ms -> about 0.033 per 33.3 ms grid step
    expect(step).toBeCloseTo((0.1 * WORD_FRAME_INTERVAL_MS) / 100, 4);
    expect(row(seq, 29)).toBeCloseTo(1.2, 5);
  });

  it("does not blend a detected value with a missing (zero) one", () => {
    const frames: TimedFrame[] = [
      { time: 0, values: frameWith(0.8) },
      { time: 100, values: frameWith(0) },
    ];
    const seq = resampleSequence(frames)!;
    for (let k = 0; k < WORD_SEQUENCE_LENGTH; k += 1) expect([0, Math.fround(0.8)]).toContain(row(seq, k));
  });

  it("snaps to the nearest frame across a long gap", () => {
    const frames: TimedFrame[] = [
      { time: 0, values: frameWith(0.2) },
      { time: 1000, values: frameWith(0.9) },
    ];
    const seq = resampleSequence(frames)!;
    expect(row(seq, 29)).toBeCloseTo(0.9);
    expect(row(seq, 28)).toBeCloseTo(0.9);
  });
});

describe("pruneHistory", () => {
  it("drops frames older than the history window", () => {
    const frames: TimedFrame[] = [0, 500, 2500, 3000].map((time) => ({ time, values: frameWith(1) }));
    expect(pruneHistory(frames, 3000).map((f) => f.time)).toEqual([2500, 3000]);
  });
});
