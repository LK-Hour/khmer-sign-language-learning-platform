export const VALUES_PER_HAND = 63;
export const MODEL_INPUT_DIM = 126;

export type HandKeypointExtraction = {
  features: number[];
  handedness: string;
  handDetected: boolean;
};

export function zeroHandKeypoints(): number[] {
  return Array<number>(VALUES_PER_HAND).fill(0);
}

export function formatHandKeypoints(
  landmarks: Array<{ x: number; y: number; z: number }>
): number[] {
  const coords: number[] = [];
  for (const landmark of landmarks) {
    coords.push(landmark.x, landmark.y, landmark.z);
  }

  while (coords.length < VALUES_PER_HAND) {
    coords.push(0);
  }

  return coords.slice(0, VALUES_PER_HAND);
}

export function buildModelFeatures(
  landmarks: Array<Array<{ x: number; y: number; z: number }>>,
  handednesses: Array<Array<{ categoryName: string }>>
): HandKeypointExtraction {
  let rightHand = zeroHandKeypoints();
  let leftHand = zeroHandKeypoints();
  let handedness: string = "Unknown";

  const detectedSides: string[] = [];

  for (let index = 0; index < landmarks.length; index += 1) {
    const side = handednesses[index]?.[0]?.categoryName ?? "Unknown";
    const keypoints = formatHandKeypoints(landmarks[index] ?? []);

    if (side === "Right") {
      rightHand = keypoints;
    } else if (side === "Left") {
      leftHand = keypoints;
    }

    detectedSides.push(side);
  }

  // Determine the correct handedness string matching notebook format
  const hasRight = detectedSides.includes("Right");
  const hasLeft = detectedSides.includes("Left");
  if (hasRight && hasLeft) {
    handedness = "both";
  } else if (hasRight) {
    handedness = "Right";
  } else if (hasLeft) {
    handedness = "Left";
  }

  return {
    features: [...rightHand, ...leftHand],
    handedness,
    handDetected: landmarks.length > 0,
  };
}
