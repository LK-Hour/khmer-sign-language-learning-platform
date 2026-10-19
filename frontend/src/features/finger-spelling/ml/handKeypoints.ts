/**
 * Feature builder for the Khmer hand-sign MLP (finger spelling and sentence
 * spelling share the same model).
 *
 * The model was trained on wrist-normalized, scale-invariant landmarks, not on
 * raw image coordinates, so the same normalization has to be applied here.
 * This is a TypeScript port of `build_feature_vector` and
 * `assign_right_and_left_hands` in
 * `docs.local/model/finger-spelling/real_time_mlp_inference_latest.py`
 * ("Option B"). The frame is mirrored before detection (see
 * `useHandLandmarker`), and on that frame MediaPipe's label is the opposite of
 * the physical hand, so "Left" is treated as the physical Right hand and
 * "Right" as the physical Left hand. The normalization is chosen from the
 * number of hands MediaPipe detected:
 *
 *   0 hands -> nothing to predict
 *   1 hand  -> wrist normalization in its own slot: physical Right (or an
 *              unlabeled hand) in the Right block, physical Left in the Left block
 *   2 hands -> pair normalization (one shared wrist midpoint and one shared
 *              x-y scale), laid out physical Left then physical Right as in training
 *
 * A single hand is laid out Right (63 values) then Left (63 values), with zeros
 * for the missing hand. In every case x, y and z are divided by the same x-y scale.
 */

export const VALUES_PER_HAND = 63;
export const MODEL_INPUT_DIM = 126;
const LANDMARK_COUNT = 21;
const SCALE_EPSILON = 1e-8;

export type Point3 = { x: number; y: number; z: number };

export type HandKeypointExtraction = {
  features: number[];
  handedness: string;
  handDetected: boolean;
};

type Detection = { points: Point3[]; side: string };

function xyDistance(point: Point3): number {
  return Math.sqrt(point.x * point.x + point.y * point.y);
}

/**
 * Center every hand on `origin` and divide by the largest x-y distance from it
 * across all the given hands. Returns one flat 63-value array per hand, or null
 * when the scale is degenerate (all points on the origin, or non-finite input).
 */
function normalizeAround(hands: Point3[][], origin: Point3): number[][] | null {
  const centered = hands.map((hand) =>
    hand.map((p) => ({ x: p.x - origin.x, y: p.y - origin.y, z: p.z - origin.z })),
  );
  const scale = Math.max(...centered.flat().map(xyDistance));
  if (!Number.isFinite(scale) || scale <= SCALE_EPSILON) return null;

  return centered.map((hand) => hand.flatMap((p) => [p.x / scale, p.y / scale, p.z / scale]));
}

/** Map MediaPipe's label on the mirrored frame to the physical hand (it is reversed). */
function toPhysicalSide(mediaPipeLabel: string): string {
  if (mediaPipeLabel === "Left") return "Right";
  if (mediaPipeLabel === "Right") return "Left";
  return "Unknown";
}

/**
 * Pick the physical Right and Left hand from two detections. The labels
 * normally give one of each; when they don't (both the same, or unknown), fall
 * back to image x-order like the reference does: smaller x is the Right hand.
 */
function assignRightAndLeft(detections: [Detection, Detection]): [Point3[], Point3[]] {
  const right = detections.find((d) => d.side === "Right");
  const left = detections.find((d) => d.side === "Left");
  if (right && left) return [right.points, left.points];

  const [first, second] = [...detections].sort((a, b) => a.points[0].x - b.points[0].x);
  return [first.points, second.points];
}

/**
 * Build the 126-value model input from raw MediaPipe landmarks and handedness.
 * `handDetected` is false only when no hand was found; if a hand was found but
 * cannot be normalized, the features are all zeros and `handDetected` stays true.
 */
export function buildModelFeatures(
  landmarks: Array<Array<Point3>>,
  handednesses: Array<Array<{ categoryName: string }>>,
): HandKeypointExtraction {
  const zeros = new Array<number>(VALUES_PER_HAND).fill(0);
  const noFeatures = [...zeros, ...zeros];

  if (landmarks.length === 0) {
    return { features: noFeatures, handedness: "Unknown", handDetected: false };
  }

  // The model only knows two hands; ignore any beyond the first two detections.
  const detections: Detection[] = landmarks.slice(0, 2).map((points, index) => ({
    points,
    side: toPhysicalSide(handednesses[index]?.[0]?.categoryName ?? "Unknown"),
  }));

  const hasRight = detections.some((d) => d.side === "Right");
  const hasLeft = detections.some((d) => d.side === "Left");
  const handedness = hasRight && hasLeft ? "both" : hasRight ? "Right" : hasLeft ? "Left" : "Unknown";

  if (detections.some((d) => d.points.length !== LANDMARK_COUNT)) {
    return { features: noFeatures, handedness, handDetected: true };
  }

  if (detections.length === 2) {
    const [right, left] = assignRightAndLeft(detections as [Detection, Detection]);
    const midpoint: Point3 = {
      x: (right[0].x + left[0].x) / 2,
      y: (right[0].y + left[0].y) / 2,
      z: (right[0].z + left[0].z) / 2,
    };
    const pair = normalizeAround([right, left], midpoint);
    // Two-hand training layout: physical Left block first, then physical Right.
    return { features: pair ? [...pair[1], ...pair[0]] : noFeatures, handedness, handDetected: true };
  }

  const [hand] = detections;
  const single = normalizeAround([hand.points], hand.points[0]);
  if (!single) return { features: noFeatures, handedness, handDetected: true };
  const features = hand.side === "Left" ? [...zeros, ...single[0]] : [...single[0], ...zeros];
  return { features, handedness, handDetected: true };
}
