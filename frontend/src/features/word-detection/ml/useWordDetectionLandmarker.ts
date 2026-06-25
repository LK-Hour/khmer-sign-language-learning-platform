"use client";

import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";

/** Matches `landmark_extract.ipynb`: 33 pose points × (x, y, z, visibility). */
export const WORD_DETECTION_POSE_LANDMARK_COUNT = 33;
export const WORD_DETECTION_POSE_FEATURES =
  WORD_DETECTION_POSE_LANDMARK_COUNT * 4;

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const HAND_MODEL_PATH = "/models/hand_landmarker.task";
const POSE_MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let handLandmarkerPromise: Promise<HandLandmarker> | null = null;
let poseLandmarkerPromise: Promise<PoseLandmarker> | null = null;

const EMPTY_DETECTION: WordDetectionLandmarks = {
  poseLandmarks: [],
  handLandmarks: [],
};

export type WordDetectionLandmarks = {
  /** 33 body landmarks (x, y, z, visibility) — first detected pose. */
  poseLandmarks: NormalizedLandmark[];
  /** Up to two hands, 21 landmarks each. */
  handLandmarks: NormalizedLandmark[][];
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
      });
    })();
  }
  return handLandmarkerPromise;
}

async function loadPoseLandmarker(): Promise<PoseLandmarker> {
  if (!poseLandmarkerPromise) {
    poseLandmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: POSE_MODEL_PATH,
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numPoses: 1,
        minPoseDetectionConfidence: 0.4,
        minPosePresenceConfidence: 0.4,
        minTrackingConfidence: 0.4,
      });
    })();
  }
  return poseLandmarkerPromise;
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

function enhanceContrast(imageData: ImageData): void {
  const data = imageData.data;
  const len = data.length;

  let min = 255;
  let max = 0;
  for (let i = 0; i < len; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < min) min = lum;
    if (lum > max) max = lum;
  }

  const range = max - min;
  if (range < 3 || range > 200) return;

  const scale = 255 / range;
  for (let i = 0; i < len; i += 4) {
    data[i] = Math.min(255, Math.max(0, (data[i] - min) * scale));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - min) * scale));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - min) * scale));
  }
}

export function useWordDetectionLandmarker() {
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const runtimeFailedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const canvas = createOffscreenCanvas();
    document.body.appendChild(canvas);
    canvasRef.current = canvas;
    ctxRef.current = canvas.getContext("2d")!;

    Promise.all([loadHandLandmarker(), loadPoseLandmarker()])
      .then(([handLandmarker, poseLandmarker]) => {
        if (cancelled) return;
        handLandmarkerRef.current = handLandmarker;
        poseLandmarkerRef.current = poseLandmarker;
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

  const detectLandmarks = useCallback((video: HTMLVideoElement): WordDetectionLandmarks => {
    const handLandmarker = handLandmarkerRef.current;
    const poseLandmarker = poseLandmarkerRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (runtimeFailedRef.current || !handLandmarker || !poseLandmarker || !canvas || !ctx) {
      return EMPTY_DETECTION;
    }

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      return EMPTY_DETECTION;
    }

    copyFrameToCanvas(video, canvas, ctx);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      let handResult = handLandmarker.detect(imageData);
      let poseResult = poseLandmarker.detect(imageData);

      if (!handResult.landmarks?.length || !poseResult.landmarks?.length) {
        enhanceContrast(imageData);
        handResult = handLandmarker.detect(imageData);
        poseResult = poseLandmarker.detect(imageData);
      }

      return {
        poseLandmarks: poseResult.landmarks?.[0] ?? [],
        handLandmarks: handResult.landmarks ?? [],
      };
    } catch {
      return EMPTY_DETECTION;
    }
  }, []);

  return {
    isReady,
    error,
    detectLandmarks,
  };
}
