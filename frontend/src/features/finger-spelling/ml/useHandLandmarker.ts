"use client";

import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildModelFeatures, type HandKeypointExtraction } from "./handKeypoints";

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_PATH = "/models/hand_landmarker.task";

let landmarkerPromise: Promise<HandLandmarker> | null = null;

async function loadHandLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      return HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });
    })();
  }

  return landmarkerPromise;
}

function toExtraction(result: HandLandmarkerResult): HandKeypointExtraction {
  return buildModelFeatures(result.landmarks, result.handednesses);
}

export function useHandLandmarker() {
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

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
            : "Failed to load hand landmarker"
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const extractFromVideo = useCallback((video: HTMLVideoElement) => {
    const landmarker = landmarkerRef.current;
    if (!landmarker) {
      throw new Error("Hand landmarker is not ready");
    }

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      return {
        features: Array<number>(126).fill(0),
        handedness: "Unknown",
        handDetected: false,
      } satisfies HandKeypointExtraction;
    }

    const result = landmarker.detectForVideo(video, performance.now());
    return toExtraction(result);
  }, []);

  return {
    isReady,
    error,
    extractFromVideo,
  };
}
