"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RawHandDetection } from "./useHandLandmarker";

export type StabilityState = "idle" | "waiting" | "stable" | "timeout";

const STABILITY_SAMPLE_MS = 100;
const STABILITY_WINDOW = 6;
const STABILITY_THRESHOLD = 0.03;
const STABLE_DURATION_MS = 1500;
const STABILITY_TIMEOUT_MS = 6000;

/**
 * Monitors hand movement and reports when the user holds their hand still
 * long enough to capture a clean prediction.
 */
export function useStabilityDetector(
  detect: () => RawHandDetection,
  onStable?: () => void,
) {
  const [state, setState] = useState<StabilityState>("idle");
  const [progress, setProgress] = useState(0);
  const samplesRef = useRef<number[][]>([]);
  const startRef = useRef<number>(0);
  const stableSinceRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const onStableRef = useRef(onStable);
  const lockedRef = useRef(false);

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
    lockedRef.current = false;
    setState("waiting");
    setProgress(0);

    const tick = (now: number) => {
      // If locked (e.g. a capture is in-flight or the consumer explicitly
      // released), stop the RAF loop to prevent re-triggering.
      if (lockedRef.current) return;

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
          // Lock immediately so the RAF loop stops and cannot fire
          // onStable again until startMonitoring is called again.
          lockedRef.current = true;
          setState("stable");
          onStableRef.current?.();
          return;
        }
      } else {
        stableSinceRef.current = null;
        setProgress(0);
      }

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
