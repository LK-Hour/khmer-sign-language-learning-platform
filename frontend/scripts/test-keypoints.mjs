/** Unit checks for browser keypoint vector formatting. */

import assert from "node:assert/strict";

const VALUES_PER_HAND = 63;
const MODEL_INPUT_DIM = 126;

function zeroHandKeypoints() {
  return Array(VALUES_PER_HAND).fill(0);
}

function formatHandKeypoints(landmarks) {
  const coords = [];
  for (const landmark of landmarks) {
    coords.push(landmark.x, landmark.y, landmark.z);
  }
  while (coords.length < VALUES_PER_HAND) coords.push(0);
  return coords.slice(0, VALUES_PER_HAND);
}

function buildModelFeatures(landmarks, handednesses) {
  let rightHand = zeroHandKeypoints();
  let leftHand = zeroHandKeypoints();
  let handedness = "Unknown";

  for (let index = 0; index < landmarks.length; index += 1) {
    const side = handednesses[index]?.[0]?.categoryName ?? "Unknown";
    const keypoints = formatHandKeypoints(landmarks[index] ?? []);

    if (side === "Right") rightHand = keypoints;
    else if (side === "Left") leftHand = keypoints;

    handedness = side;
  }

  return {
    features: [...rightHand, ...leftHand],
    handedness,
    handDetected: landmarks.length > 0,
  };
}

const lm = Array.from({ length: 21 }, (_, i) => ({
  x: i * 0.01,
  y: i * 0.02,
  z: i * 0.003,
}));

const rightOnly = buildModelFeatures([lm], [[{ categoryName: "Right" }]]);
assert.equal(rightOnly.features.length, MODEL_INPUT_DIM);
assert.equal(rightOnly.handDetected, true);
assert.equal(rightOnly.handedness, "Right");
assert.ok(rightOnly.features[0] === 0);

const empty = buildModelFeatures([], []);
assert.equal(empty.features.length, MODEL_INPUT_DIM);
assert.equal(empty.handDetected, false);

console.log("PASS frontend keypoint vector formatting");
