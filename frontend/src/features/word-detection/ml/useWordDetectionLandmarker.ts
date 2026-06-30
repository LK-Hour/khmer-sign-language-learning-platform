"use client";

import {
  type Category,
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";

/** Matches the final active extraction loop in `landmark_extract.ipynb`. */
export const WORD_DETECTION_SEQUENCE_LENGTH = 30;
export const WORD_DETECTION_HAND_FEATURES = 21 * 3;   // 63 features per hand (x, y, z for 21 landmarks)
export const WORD_DETECTION_POSITION_FEATURES =
  WORD_DETECTION_HAND_FEATURES * 2;
export const WORD_DETECTION_TOTAL_FEATURES =
  WORD_DETECTION_POSITION_FEATURES * 2;

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const HAND_MODEL_PATH = "/models/hand_landmarker.task";

let handLandmarkerPromise: Promise<HandLandmarker> | null = null;

const EMPTY_FRAME_FEATURES = new Float32Array(WORD_DETECTION_POSITION_FEATURES);

const EMPTY_DETECTION: WordDetectionLandmarks = {
  poseLandmarks: [],
  handLandmarks: [],
  frameFeatures: EMPTY_FRAME_FEATURES,
  sequenceFeatures: null,
};

export type WordDetectionLandmarks = {
  /** Kept for overlay compatibility. Word model features are hands-only. */
  poseLandmarks: NormalizedLandmark[];
  /** Up to two hands, 21 landmarks each. */
  handLandmarks: NormalizedLandmark[][];
  /** Current frame positions: left hand 63 + right hand 63. */
  frameFeatures: Float32Array;
  /** Flattened row-major (30, 252) sequence, or null before any valid frame. */
  sequenceFeatures: Float32Array | null;
};

async function loadHandLandmarker(): Promise<HandLandmarker> {
  if (!handLandmarkerPromise) {
    handLandmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      return HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_MODEL_PATH,
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    })();
  }
  return handLandmarkerPromise;
}

function createOffscreenCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "-9999px";
  canvas.style.left = "-9999px";
  canvas.style.width = "1px";
  canvas.style.height = "1px";
  return canvas;
}

function copyFrameToCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): void {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
}

function extractNativeHand(handLandmarks: NormalizedLandmark[] | undefined): Float32Array {
  const features = new Float32Array(WORD_DETECTION_HAND_FEATURES);
  if (!handLandmarks?.length) return features;

  const wrist = handLandmarks[0];
  const count = Math.min(handLandmarks.length, 21);

  for (let i = 0; i < count; i += 1) {
    const landmark = handLandmarks[i];
    const offset = i * 3;
    features[offset] = landmark.x - wrist.x;
    features[offset + 1] = landmark.y - wrist.y;
    features[offset + 2] = landmark.z - wrist.z;
  }

  return features;
}

function handednessName(categories: Category[] | undefined): string {
  return categories?.[0]?.categoryName?.toLowerCase() ?? "";
}

function slotHandsByHandedness(
  landmarks: NormalizedLandmark[][],
  handedness: Category[][],
): [NormalizedLandmark[] | undefined, NormalizedLandmark[] | undefined] {
  let leftHand: NormalizedLandmark[] | undefined;
  let rightHand: NormalizedLandmark[] | undefined;
  const fallbackHands: NormalizedLandmark[][] = [];

  landmarks.forEach((hand, index) => {
    const label = handednessName(handedness[index]);
    if (label === "left" && !leftHand) {
      leftHand = hand;
      return;
    }
    if (label === "right" && !rightHand) {
      rightHand = hand;
      return;
    }
    fallbackHands.push(hand);
  });

  for (const hand of fallbackHands) {
    if (!leftHand) {
      leftHand = hand;
    } else if (!rightHand) {
      rightHand = hand;
    }
  }

  return [leftHand, rightHand];
}

function extractFrameFeatures(
  landmarks: NormalizedLandmark[][],
  handedness: Category[][],
): Float32Array {
  const [leftHand, rightHand] = slotHandsByHandedness(landmarks, handedness);
  const frameFeatures = new Float32Array(WORD_DETECTION_POSITION_FEATURES);
  frameFeatures.set(extractNativeHand(leftHand), 0);
  frameFeatures.set(extractNativeHand(rightHand), WORD_DETECTION_HAND_FEATURES);
  return frameFeatures;
}

function cloneFrame(frame: Float32Array): Float32Array {
  return new Float32Array(frame);
}

function linspaceIndex(index: number, totalFrames: number): number {
  if (WORD_DETECTION_SEQUENCE_LENGTH <= 1) return 0;
  return Math.trunc(
    (index * (totalFrames - 1)) / (WORD_DETECTION_SEQUENCE_LENGTH - 1),
  );
}

function standardizeSequence(frames: Float32Array[]): Float32Array[] {
  const totalFrames = frames.length;
  if (totalFrames === 0) return [];

  if (totalFrames >= WORD_DETECTION_SEQUENCE_LENGTH) {
    return Array.from({ length: WORD_DETECTION_SEQUENCE_LENGTH }, (_, index) =>
      cloneFrame(frames[linspaceIndex(index, totalFrames)]),
    );
  }

  const positions = frames.map(cloneFrame);
  const lastFrame = frames[totalFrames - 1];
  while (positions.length < WORD_DETECTION_SEQUENCE_LENGTH) {
    positions.push(cloneFrame(lastFrame));
  }
  return positions;
}

function buildSequenceFeatures(frames: Float32Array[]): Float32Array | null {
  const positions = standardizeSequence(frames);
  if (positions.length === 0) return null;

  const sequenceFeatures = new Float32Array(
    WORD_DETECTION_SEQUENCE_LENGTH * WORD_DETECTION_TOTAL_FEATURES,
  );

  for (let frameIndex = 0; frameIndex < WORD_DETECTION_SEQUENCE_LENGTH; frameIndex += 1) {
    const position = positions[frameIndex];
    const outputOffset = frameIndex * WORD_DETECTION_TOTAL_FEATURES;
    sequenceFeatures.set(position, outputOffset);

    if (frameIndex === 0) continue;

    const previousPosition = positions[frameIndex - 1];
    const velocityOffset = outputOffset + WORD_DETECTION_POSITION_FEATURES;
    for (let i = 0; i < WORD_DETECTION_POSITION_FEATURES; i += 1) {
      sequenceFeatures[velocityOffset + i] = position[i] - previousPosition[i];
    }
  }

  return sequenceFeatures;
}

export function useWordDetectionLandmarker() {
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const runtimeFailedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sequenceFramesRef = useRef<Float32Array[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const canvas = createOffscreenCanvas();
    document.body.appendChild(canvas);
    canvasRef.current = canvas;
    ctxRef.current = canvas.getContext("2d")!;

    loadHandLandmarker()
      .then((handLandmarker) => {
        if (cancelled) return;
        handLandmarkerRef.current = handLandmarker;
        setIsReady(true);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load word-detection landmark models",
        );
      });

    return () => {
      cancelled = true;
      document.body.removeChild(canvas);
      canvasRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  const resetSequence = useCallback(() => {
    sequenceFramesRef.current = [];
  }, []);

  const detectLandmarks = useCallback((video: HTMLVideoElement): WordDetectionLandmarks => {
    const handLandmarker = handLandmarkerRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (runtimeFailedRef.current || !handLandmarker || !canvas || !ctx) {
      return EMPTY_DETECTION;
    }

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      return EMPTY_DETECTION;
    }

    copyFrameToCanvas(video, canvas, ctx);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const handResult = handLandmarker.detect(imageData);
      const handLandmarks = handResult.landmarks ?? [];
      const handedness = handResult.handedness ?? handResult.handednesses ?? [];
      const frameFeatures = extractFrameFeatures(handLandmarks, handedness);
      sequenceFramesRef.current.push(frameFeatures);
      const sequenceFeatures = buildSequenceFeatures(sequenceFramesRef.current);

      return {
        poseLandmarks: [],
        handLandmarks,
        frameFeatures,
        sequenceFeatures,
      };
    } catch {
      return EMPTY_DETECTION;
    }
  }, []);

  return {
    isReady,
    error,
    detectLandmarks,
    resetSequence,
  };
}
