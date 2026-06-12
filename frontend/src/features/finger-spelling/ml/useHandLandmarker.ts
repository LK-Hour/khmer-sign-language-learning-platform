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
 * This corrects the mirror-reversed handedness that MediaPipe reports
 * when using a front-facing (selfie) camera.
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

    mirrorFrameToCanvas(video, canvas, ctx);
    const imageData = getCanvasImageData(canvas, ctx);

    try {
      let result = landmarker.detect(imageData);

      if (!result.landmarks || result.landmarks.length === 0) {
        enhanceContrast(imageData);
        result = landmarker.detect(imageData);
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
        let result = landmarker.detect(imageData);

        if (!result.landmarks || result.landmarks.length === 0) {
          // Fallback: contrast enhance and retry on the same natural frame.
          enhanceContrast(imageData);
          result = landmarker.detect(imageData);
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

// ─── Stability Detection ────────────────────────────────────────────────

export type StabilityState = "idle" | "waiting" | "stable" | "timeout";

const STABILITY_SAMPLE_MS = 100; // sample every 100ms
const STABILITY_WINDOW = 6;       // number of recent samples to check
const STABILITY_THRESHOLD = 0.03; // avg delta per coordinate (normalized 0-1)
const STABLE_DURATION_MS = 3000;  // must be stable for 3s
const STABILITY_TIMEOUT_MS = 5000; // timeout after 5s of waiting

/**
 * Hook that monitors hand movement and reports when the user holds
 * their hand still for long enough to capture a clean prediction.
 */
export function useStabilityDetector(
  detect: () => RawHandDetection,
  onStable?: () => void,
) {
  const [state, setState] = useState<StabilityState>("idle");
  const [progress, setProgress] = useState(0); // 0-100 for UI indicator
  const samplesRef = useRef<number[][]>([]);
  const startRef = useRef<number>(0);
  const stableSinceRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const onStableRef = useRef(onStable);

  useEffect(() => {
    onStableRef.current = onStable;
  }, [onStable]);

  const computeDelta = useCallback((prev: number[], curr: number[]): number => {
    if (prev.length === 0 || curr.length === 0) return Infinity;
    const len = Math.min(prev.length, curr.length);
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += Math.abs(curr[i] - prev[i]);
    }
    return sum / len;
  }, []);

  const flattenLandmarks = (detection: RawHandDetection): number[] => {
    const flat: number[] = [];
    for (const hand of detection.landmarks) {
      for (const lm of hand) {
        flat.push(lm.x, lm.y, lm.z);
      }
    }
    return flat;
  };

  const isCurrentlyStable = useCallback((): boolean => {
    const samples = samplesRef.current;
    if (samples.length < STABILITY_WINDOW) return false;
    const recent = samples.slice(-STABILITY_WINDOW);
    for (let i = 1; i < recent.length; i++) {
      if (computeDelta(recent[i - 1], recent[i]) > STABILITY_THRESHOLD) {
        return false;
      }
    }
    return true;
  }, [computeDelta]);

  const startMonitoring = useCallback(() => {
    samplesRef.current = [];
    startRef.current = performance.now();
    stableSinceRef.current = null;
    setState("waiting");
    setProgress(0);

    const tick = (now: number) => {
      // Throttle to ~100ms
      if (now - lastFrameRef.current < STABILITY_SAMPLE_MS) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastFrameRef.current = now;

      const detection = detect();
      if (detection.landmarks.length === 0) {
        samplesRef.current = [];
        stableSinceRef.current = null;
        setProgress(0);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      samplesRef.current.push(flattenLandmarks(detection));
      // Keep only last STABILITY_WINDOW * 2 samples
      if (samplesRef.current.length > STABILITY_WINDOW * 2) {
        samplesRef.current = samplesRef.current.slice(-STABILITY_WINDOW * 2);
      }

      const elapsed = now - startRef.current;
      setState("waiting");

      if (isCurrentlyStable()) {
        stableSinceRef.current ??= now;
        const stableTime = now - stableSinceRef.current;
        const pct = Math.min(100, Math.round((stableTime / STABLE_DURATION_MS) * 100));
        setProgress(pct);

        if (stableTime >= STABLE_DURATION_MS) {
          stableSinceRef.current = null;
          setState("stable");
          onStableRef.current?.();
          return; // stop monitoring
        }
      } else {
        stableSinceRef.current = null;
        setProgress(0);
      }

      // Timeout check
      if (elapsed >= STABILITY_TIMEOUT_MS) {
        setState("timeout");
        samplesRef.current = [];
        stableSinceRef.current = null;
        startRef.current = now;
        setProgress(0);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [detect, isCurrentlyStable]);

  const stopMonitoring = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    samplesRef.current = [];
    stableSinceRef.current = null;
    setState("idle");
    setProgress(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    state,
    progress,
    startMonitoring,
    stopMonitoring,
  };
}
