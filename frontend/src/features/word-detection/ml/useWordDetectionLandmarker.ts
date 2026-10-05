"use client";

import {
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  WORD_RAW_FRAME_FEATURES,
  WORD_SEQUENCE_LENGTH,
  buildRawFrame,
  pruneHistory,
  resampleSequence,
  type TimedFrame,
} from "./wordSequence";

/** 30 consecutive frames at 30 fps, as in training. */
export const WORD_DETECTION_SEQUENCE_LENGTH = WORD_SEQUENCE_LENGTH;
/** Raw landmark values per frame (pose 132 + two hands 126); the backend builds the model features. */
export const WORD_DETECTION_TOTAL_FEATURES = WORD_RAW_FRAME_FEATURES;

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
/** "full" is the equivalent of the live test's Holistic model_complexity=1. */
const POSE_MODEL_PATH = "/models/pose_landmarker_full.task";
const HAND_MODEL_PATH = "/models/hand_landmarker.task";
const POSE_LEFT_WRIST = 15;
const POSE_RIGHT_WRIST = 16;

type Landmarkers = { pose: PoseLandmarker; hand: HandLandmarker };

let landmarkersPromise: Promise<Landmarkers> | null = null;

const EMPTY_DETECTION: WordDetectionLandmarks = {
  poseLandmarks: [],
  handLandmarks: [],
  handDetected: false,
  sequenceFeatures: null,
};

export type WordDetectionLandmarks = {
  /** Pose landmarks (33) when a body was detected, for the overlay. */
  poseLandmarks: NormalizedLandmark[];
  /** Always [left, right] in the live test's (Holistic) sense; an empty array when that hand is missing. */
  handLandmarks: NormalizedLandmark[][];
  /** True when at least one hand was detected in this frame. */
  handDetected: boolean;
  /** Flattened row-major (30, 258) raw sequence on a 30 fps grid, or null before any valid frame. */
  sequenceFeatures: Float32Array | null;
};

/**
 * Pose + hands -- the parts of Holistic the word model uses, as two calls.
 * A dedicated hand detector finds hands anywhere in the frame; Holistic only
 * looks around the pose wrists and loses hands when a wrist is misplaced. It
 * also skips Holistic's face mesh, which the model never reads.
 * Settings mirror the live test (confidence 0.5, model complexity "full").
 * VIDEO mode tracks across frames like the live test's static_image_mode=False.
 */
async function loadLandmarkers(): Promise<Landmarkers> {
  if (!landmarkersPromise) {
    landmarkersPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      const [pose, hand] = await Promise.all([
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: POSE_MODEL_PATH, delegate: "GPU" },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        }),
        HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL_PATH, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        }),
      ]);
      return { pose, hand };
    })();
  }
  return landmarkersPromise;
}

function squaredDistance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/**
 * Put detected hands into Holistic's [left, right] slots. Holistic attaches
 * each hand to the pose wrist it belongs to, so match every hand's wrist to the
 * nearest pose wrist (15 = left, 16 = right). Without a pose, fall back to image
 * position: on the mirrored frame the pose's left side has the larger x.
 */
function assignHands(
  hands: NormalizedLandmark[][],
  pose: NormalizedLandmark[],
): [NormalizedLandmark[], NormalizedLandmark[]] {
  const detected = hands.filter((hand) => hand.length > 0).slice(0, 2);
  if (detected.length === 0) return [[], []];

  if (pose.length > POSE_RIGHT_WRIST) {
    const leftWrist = pose[POSE_LEFT_WRIST];
    const rightWrist = pose[POSE_RIGHT_WRIST];
    const leftScore = (hand: NormalizedLandmark[]) =>
      squaredDistance(hand[0], leftWrist) - squaredDistance(hand[0], rightWrist);

    if (detected.length === 1) {
      return leftScore(detected[0]) <= 0 ? [detected[0], []] : [[], detected[0]];
    }
    const [a, b] = detected;
    return leftScore(a) <= leftScore(b) ? [a, b] : [b, a];
  }

  const byX = [...detected].sort((a, b) => b[0].x - a[0].x);
  if (byX.length === 1) return byX[0][0].x >= 0.5 ? [byX[0], []] : [[], byX[0]];
  return [byX[0], byX[1]];
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
  // Mirror before detection, exactly like the live test (cv2.flip(frame, 1)):
  // landmarks and the left/right hand slots are then in the mirrored view.
  ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export function useWordDetectionLandmarker() {
  const landmarkersRef = useRef<Landmarkers | null>(null);
  const runtimeFailedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const framesRef = useRef<TimedFrame[]>([]);
  const lastTimestampRef = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const canvas = createOffscreenCanvas();
    document.body.appendChild(canvas);
    canvasRef.current = canvas;
    ctxRef.current = canvas.getContext("2d")!;

    loadLandmarkers()
      .then((landmarkers) => {
        if (cancelled) return;
        landmarkersRef.current = landmarkers;
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
    framesRef.current = [];
  }, []);

  const detectLandmarks = useCallback((video: HTMLVideoElement): WordDetectionLandmarks => {
    const landmarkers = landmarkersRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (runtimeFailedRef.current || !landmarkers || !canvas || !ctx) {
      return EMPTY_DETECTION;
    }

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      return EMPTY_DETECTION;
    }

    copyFrameToCanvas(video, canvas, ctx);
    const now = performance.now();
    // VIDEO mode needs strictly increasing timestamps.
    const timestamp = Math.max(now, lastTimestampRef.current + 1);
    lastTimestampRef.current = timestamp;

    try {
      // Pass the mirrored canvas directly: no getImageData GPU->CPU readback.
      const poseResult = landmarkers.pose.detectForVideo(canvas, timestamp);
      const handResult = landmarkers.hand.detectForVideo(canvas, timestamp);
      const pose = poseResult.landmarks?.[0] ?? [];
      const [left, right] = assignHands(handResult.landmarks ?? [], pose);
      const handLandmarks = [left, right];
      const handDetected = left.length > 0 || right.length > 0;

      // Only accumulate frames with a hand: all-zero frames make the model emit
      // a phantom default prediction.
      if (!handDetected) {
        return {
          poseLandmarks: pose,
          handLandmarks,
          handDetected: false,
          sequenceFeatures: resampleSequence(framesRef.current),
        };
      }

      const frame = buildRawFrame(pose, left, right);
      framesRef.current = pruneHistory([...framesRef.current, { time: now, values: frame }], now);

      return {
        poseLandmarks: pose,
        handLandmarks,
        handDetected: true,
        sequenceFeatures: resampleSequence(framesRef.current),
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
