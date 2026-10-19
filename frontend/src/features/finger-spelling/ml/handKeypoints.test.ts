import { describe, expect, it } from "vitest";
import { MODEL_INPUT_DIM, VALUES_PER_HAND, buildModelFeatures, type Point3 } from "./handKeypoints";

// MediaPipe labels on the mirrored frame; each is the opposite physical hand.
const RIGHT = [{ categoryName: "Right" }];
const LEFT = [{ categoryName: "Left" }];
const PHYSICAL_RIGHT = LEFT;
const PHYSICAL_LEFT = RIGHT;

/** A 21-point hand whose wrist (index 0) is exactly at (ox, oy, oz). */
function makeHand(ox: number, oy: number, oz: number): Point3[] {
  return Array.from({ length: 21 }, (_, i) => ({
    x: ox + 0.03 * i,
    y: oy + 0.02 * (i % 5),
    z: oz - 0.01 * i,
  }));
}

const rightBlock = (features: number[]) => features.slice(0, VALUES_PER_HAND);
const leftBlock = (features: number[]) => features.slice(VALUES_PER_HAND);

function maxXyDistance(block: number[]): number {
  let max = 0;
  for (let i = 0; i < block.length; i += 3) max = Math.max(max, Math.hypot(block[i], block[i + 1]));
  return max;
}

function expectClose(actual: number[], expected: number[]) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 9));
}

describe("buildModelFeatures", () => {
  it("returns 126 zeros and handDetected=false when no hand is found", () => {
    const result = buildModelFeatures([], []);

    expect(result.features).toEqual(new Array(MODEL_INPUT_DIM).fill(0));
    expect(result.handDetected).toBe(false);
    expect(result.handedness).toBe("Unknown");
  });

  it("wrist-normalizes one hand: wrist at the origin, x-y extent scaled to 1", () => {
    const result = buildModelFeatures([makeHand(0.6, 0.4, 0.05)], [PHYSICAL_RIGHT]);

    expect(result.features).toHaveLength(MODEL_INPUT_DIM);
    expect(result.handDetected).toBe(true);
    expect(rightBlock(result.features).slice(0, 3)).toEqual([0, 0, 0]);
    expect(maxXyDistance(rightBlock(result.features))).toBeCloseTo(1, 9);
    expect(leftBlock(result.features).every((v) => v === 0)).toBe(true);
  });

  it("puts a single hand in its physical slot, reversing MediaPipe's label", () => {
    const hand = makeHand(0.3, 0.5, 0);

    const physicalRight = buildModelFeatures([hand], [PHYSICAL_RIGHT]);
    const physicalLeft = buildModelFeatures([hand], [PHYSICAL_LEFT]);
    const unlabeled = buildModelFeatures([hand], []);

    expect(physicalRight.handedness).toBe("Right");
    expect(leftBlock(physicalRight.features).every((v) => v === 0)).toBe(true);

    expect(physicalLeft.handedness).toBe("Left");
    expect(rightBlock(physicalLeft.features).every((v) => v === 0)).toBe(true);
    expect(leftBlock(physicalLeft.features)).toEqual(rightBlock(physicalRight.features));

    // An unlabeled hand goes in the Right slot.
    expect(unlabeled.features).toEqual(physicalRight.features);
  });

  it("is invariant to where the hand is and how large it appears", () => {
    const near = makeHand(0.2, 0.7, 0.02);
    const far = near.map((p) => ({ x: p.x * 0.5 + 0.3, y: p.y * 0.5 + 0.1, z: p.z * 0.5 }));

    expectClose(
      buildModelFeatures([far], [PHYSICAL_RIGHT]).features,
      buildModelFeatures([near], [PHYSICAL_RIGHT]).features,
    );
  });

  it("pair-normalizes two hands around one shared wrist midpoint and scale", () => {
    const right = makeHand(0.7, 0.4, 0.05);
    const left = makeHand(0.2, 0.6, -0.02);

    const { features, handedness } = buildModelFeatures([right, left], [PHYSICAL_RIGHT, PHYSICAL_LEFT]);

    expect(handedness).toBe("both");
    // Two-hand layout is physical Left first, then physical Right.
    const leftWrist = rightBlock(features).slice(0, 3);
    const rightWrist = leftBlock(features).slice(0, 3);
    // Shared midpoint: the wrists sit symmetrically around the origin, not on it.
    rightWrist.forEach((v, i) => expect(v).toBeCloseTo(-leftWrist[i], 9));
    expect(rightWrist.some((v) => v !== 0)).toBe(true);
    // Shared scale: the larger of the two hands' extents is exactly 1.
    expect(
      Math.max(maxXyDistance(rightBlock(features)), maxXyDistance(leftBlock(features))),
    ).toBeCloseTo(1, 9);
  });

  it("orders two hands physical Left then physical Right regardless of detection order", () => {
    const right = makeHand(0.7, 0.4, 0.05);
    const left = makeHand(0.2, 0.6, -0.02);

    const rightFirst = buildModelFeatures([right, left], [PHYSICAL_RIGHT, PHYSICAL_LEFT]).features;
    const leftFirst = buildModelFeatures([left, right], [PHYSICAL_LEFT, PHYSICAL_RIGHT]).features;

    expect(leftFirst).toEqual(rightFirst);
  });

  it("falls back to image x-order when both hands carry the same label", () => {
    // MediaPipe can label both hands "Right"; that used to drop the second hand.
    // Smaller x is taken as the physical Right hand.
    const smallerX = makeHand(0.2, 0.6, 0);
    const largerX = makeHand(0.7, 0.4, 0);
    const expected = buildModelFeatures([smallerX, largerX], [PHYSICAL_RIGHT, PHYSICAL_LEFT]).features;

    const bothRight = buildModelFeatures([largerX, smallerX], [RIGHT, RIGHT]);
    const bothLeft = buildModelFeatures([largerX, smallerX], [LEFT, LEFT]);
    const unlabeled = buildModelFeatures([largerX, smallerX], []);

    expect(bothRight.features).toEqual(expected);
    expect(bothLeft.features).toEqual(expected);
    expect(unlabeled.features).toEqual(expected);
    expect(bothRight.handedness).toBe("Left");
    expect(leftBlock(bothRight.features).some((v) => v !== 0)).toBe(true);
  });

  it("ignores detections beyond the first two", () => {
    const [a, b, c] = [makeHand(0.7, 0.4, 0), makeHand(0.2, 0.6, 0), makeHand(0.5, 0.5, 0)];

    const withThird = buildModelFeatures([a, b, c], [RIGHT, LEFT, RIGHT]).features;

    expect(withThird).toEqual(buildModelFeatures([a, b], [RIGHT, LEFT]).features);
  });

  it("keeps handDetected=true but returns zeros for a degenerate hand", () => {
    const collapsed = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0.1 }));

    const result = buildModelFeatures([collapsed], [RIGHT]);

    expect(result.handDetected).toBe(true);
    expect(result.features).toEqual(new Array(MODEL_INPUT_DIM).fill(0));
  });

  it("returns zeros when a hand does not have exactly 21 landmarks", () => {
    const result = buildModelFeatures([makeHand(0.5, 0.5, 0).slice(0, 20)], [RIGHT]);

    expect(result.handDetected).toBe(true);
    expect(result.features).toEqual(new Array(MODEL_INPUT_DIM).fill(0));
  });
});
