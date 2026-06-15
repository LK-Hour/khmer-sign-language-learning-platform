"use client";

import {
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildModelFeatures, type HandKeypointExtraction } from "./handKeypoints";

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_PATH = "/models/hand_landmarker.task";

let landmarkerPromise: Promise<HandLandmarker> | null = null;

const EMPTY_DETECTION: RawHandDetection = {
  landmarks: [],
  handednesses: [],
};

async function loadHandLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      return HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        numHands: 2,
      });
    })();
  }
  return landmarkerPromise;
}

/**
 * Draw a single video frame onto a canvas, flipped horizontally.
 * Used by the overlay path where visual mirroring is needed.
 * WARNING: Do NOT use for prediction extraction — mirroring swaps
 * MediaPipe's handedness labels (Left↔Right), corrupting the model input.
 * Use copyFrameToCanvas() instead for prediction frames.
 */
function mirrorFrameToCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): void {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();
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

function getCanvasImageData(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): ImageData {
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Simple contrast stretch — a browser-side approximation of CLAHE.
 */
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
    data[i]     = Math.min(255, Math.max(0, (data[i]     - min) * scale));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - min) * scale));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - min) * scale));
  }
}

/** Raw detection result for visualization. */
export type RawHandDetection = {
  landmarks: Array<Array<NormalizedLandmark>>;
  handednesses: Array<Array<{ categoryName: string; score: number }>>;
};

function createOffscreenCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.style.position = "fixed";
  c.style.top = "-9999px";
  c.style.left = "-9999px";
  c.style.width = "1px";
  c.style.height = "1px";
  return c;
}

export function useHandLandmarker() {
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const runtimeFailedRef = useRef(false);
  const extractionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const extractionCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Dedicated canvas for prediction extraction.
    const extractionCanvas = createOffscreenCanvas();
    document.body.appendChild(extractionCanvas);
    extractionCanvasRef.current = extractionCanvas;
    extractionCtxRef.current = extractionCanvas.getContext("2d")!;

    // Dedicated canvas for overlay animation loop
    const overlayCanvas = createOffscreenCanvas();
    document.body.appendChild(overlayCanvas);
    overlayCanvasRef.current = overlayCanvas;
    overlayCtxRef.current = overlayCanvas.getContext("2d")!;

    loadHandLandmarker()
      .then((landmarker) => {
        if (cancelled) return;
        landmarkerRef.current = landmarker;
        setIsReady(true);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load hand landmarker",
        );
      });

    return () => {
      cancelled = true;
      document.body.removeChild(extractionCanvas);
      document.body.removeChild(overlayCanvas);
      extractionCanvasRef.current = null;
      extractionCtxRef.current = null;
      overlayCanvasRef.current = null;
      overlayCtxRef.current = null;
    };
  }, []);

  /** Extract features for model prediction. Uses its own canvas. */
  const extractFromVideo = useCallback((video: HTMLVideoElement) => {
    const landmarker = landmarkerRef.current;
    const canvas = extractionCanvasRef.current;
    const ctx = extractionCtxRef.current;

    if (runtimeFailedRef.current || !landmarker || !canvas || !ctx) {
      throw new Error("Hand landmarker is not ready");
    }

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      return {
        features: Array<number>(126).fill(0),
        handedness: "Unknown",
        handDetected: false,
      } satisfies HandKeypointExtraction;
    }

    copyFrameToCanvas(video, canvas, ctx);
    const imageData = getCanvasImageData(canvas, ctx);

    try {
      let result = landmarker?.detect(imageData);

      if (!result.landmarks || result.landmarks.length === 0) {
        enhanceContrast(imageData);
        result = landmarker?.detect(imageData);
      }

      return buildModelFeatures(result.landmarks, result.handednesses);
    } catch (detectError) {
      runtimeFailedRef.current = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      landmarkerPromise = null;
      setIsReady(false);
      setError(
        detectError instanceof Error
          ? detectError.message
          : "Hand landmarker failed while detecting landmarks",
      );
      throw detectError;
    }
  }, []);

  /**
   * Detect landmarks for overlay visualization.
   * Detects from a 2D canvas instead of the video element to avoid MediaPipe's
   * WebGL texture path, which can fail when its internal GL context is absent.
   * The overlay canvas's CSS `scaleX(-1)` handles visual alignment with
   * the mirrored video display.
   * Uses its own offscreen canvas so there's no race condition with `extractFromVideo`. */
  const detectLandmarks = useCallback(
    (video: HTMLVideoElement): RawHandDetection => {
      const landmarker = landmarkerRef.current;
      const canvas = overlayCanvasRef.current;
      const ctx = overlayCtxRef.current;

      if (runtimeFailedRef.current || !landmarker || !canvas || !ctx) {
        return EMPTY_DETECTION;
      }

      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        return EMPTY_DETECTION;
      }

      copyFrameToCanvas(video, canvas, ctx);
      const imageData = getCanvasImageData(canvas, ctx);

      try {
        let result = landmarker?.detect(imageData);

        if (!result.landmarks || result.landmarks.length === 0) {
          // Fallback: contrast enhance and retry on the same natural frame.
          enhanceContrast(imageData);
          result = landmarker?.detect(imageData);
        }

        return {
          landmarks: result.landmarks ?? [],
          handednesses: (result.handednesses as RawHandDetection["handednesses"]) ?? [],
        };
      } catch {
        // Detection may fail transiently (e.g. GL context busy).
        // Return empty — the overlay will retry on the next frame.
        return EMPTY_DETECTION;
      }
    },
    [],
  );

  return {
    isReady,
    error,
    extractFromVideo,
    detectLandmarks,
  };
}
