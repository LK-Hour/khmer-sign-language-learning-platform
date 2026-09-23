/**
 * Feature vector builder for the sentence-spelling hand-sign model.
 *
 * Unlike finger-spelling's model (trained on raw image-space landmark
 * coordinates, see `finger-spelling/ml/handKeypoints.ts`), this model was
 * trained on wrist-normalized, scale-invariant coordinates — see the
 * reference implementation in
 * `docs.local/model/word-detection/khmer_render_test/khmer_realtime_word.py`
 * (`normalize_single_hand` / `normalize_hand_pair` / `build_feature_vector`).
 * This is a direct TypeScript port of that preprocessing, verified
 * numerically against the Python source.
 */

export const VALUES_PER_HAND = 63;
export const MODEL_INPUT_DIM = 126;
const SCALE_EPSILON = 1e-8;

export type Point3 = { x: number; y: number; z: number };

export type SentenceKeypointExtraction = {
  features: number[];
  handedness: string;
  handDetected: boolean;
};

function subtract(a: Point3, b: Point3): Point3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function xyDistance(p: Point3): number {
  return Math.sqrt(p.x * p.x + p.y * p.y);
}

/** Wrist-normalize one detected hand using one x-y scale for x, y, and z. */
function normalizeSingleHand(hand: Point3[]): number[] | null {
  const wrist = hand[0];
  const centered = hand.map((p) => subtract(p, wrist));
  const scale = Math.max(...centered.map(xyDistance));
  if (scale <= SCALE_EPSILON) return null;
  const flat: number[] = [];
  for (const p of centered) {
    flat.push(p.x / scale, p.y / scale, p.z / scale);
  }
  return flat;
}

/** Pair-normalize two hands using one shared wrist midpoint and x-y scale. */
function normalizeHandPair(right: Point3[], left: Point3[]): [number[], number[]] | null {
  const midpoint: Point3 = {
    x: (right[0].x + left[0].x) / 2,
    y: (right[0].y + left[0].y) / 2,
    z: (right[0].z + left[0].z) / 2,
  };
  const rightCentered = right.map((p) => subtract(p, midpoint));
  const leftCentered = left.map((p) => subtract(p, midpoint));
  const scale = Math.max(
    ...rightCentered.map(xyDistance),
    ...leftCentered.map(xyDistance)
  );
  if (scale <= SCALE_EPSILON) return null;

  const flatten = (points: Point3[]) => {
    const flat: number[] = [];
    for (const p of points) flat.push(p.x / scale, p.y / scale, p.z / scale);
    return flat;
  };
  return [flatten(rightCentered), flatten(leftCentered)];
}

/**
 * Build the 126-value model input from raw MediaPipe landmarks, selecting
 * the normalization strategy from the detected hand count exactly like the
 * Python reference: 0 hands -> none, 1 hand -> wrist normalization (placed
 * in the "right" slot regardless of which hand was actually detected,
 * matching the trained dataset), 2 hands -> pair normalization.
 */
export function buildSentenceModelFeatures(
  landmarks: Array<Array<Point3>>,
  handednesses: Array<Array<{ categoryName: string }>>
): SentenceKeypointExtraction {
  const zeros = new Array<number>(VALUES_PER_HAND).fill(0);

  if (landmarks.length === 0) {
    return { features: [...zeros, ...zeros], handedness: "Unknown", handDetected: false };
  }

  let rightHand: Point3[] | null = null;
  let leftHand: Point3[] | null = null;
  const detectedSides: string[] = [];

  for (let index = 0; index < landmarks.length; index += 1) {
    const side = handednesses[index]?.[0]?.categoryName ?? "Unknown";
    const points = landmarks[index];
    if (side === "Right" && !rightHand) rightHand = points;
    else if (side === "Left" && !leftHand) leftHand = points;
    detectedSides.push(side);
  }

  const hasRight = Boolean(rightHand);
  const hasLeft = Boolean(leftHand);
  const handedness = hasRight && hasLeft ? "both" : hasRight ? "Right" : hasLeft ? "Left" : "Unknown";

  if (hasRight && hasLeft && rightHand && leftHand) {
    const pair = normalizeHandPair(rightHand, leftHand);
    if (!pair) return { features: [...zeros, ...zeros], handedness, handDetected: true };
    return { features: [...pair[0], ...pair[1]], handedness, handDetected: true };
  }

  // Exactly one hand detected (or an unrecognized handedness label) — use
  // whichever hand came back and place it in the "right" slot, per the
  // trained dataset's single-hand convention.
  const singleHand = rightHand ?? leftHand ?? landmarks[0];
  const normalized = normalizeSingleHand(singleHand);
  if (!normalized) return { features: [...zeros, ...zeros], handedness, handDetected: true };
  return { features: [...normalized, ...zeros], handedness, handDetected: true };
}
