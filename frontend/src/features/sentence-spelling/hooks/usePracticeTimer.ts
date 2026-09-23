"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Client-only stopwatch for a practice run. `performance.now()` is monotonic,
 * so it isn't thrown off by system-clock changes, and nothing is sent to the
 * server. `elapsedMs` stays `null` until the run is stopped — and also when
 * the clock never started (e.g. the camera never became ready).
 */
export function usePracticeTimer() {
  const startedAtRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  /** Idempotent: only the first call after a reset starts the clock. */
  const start = useCallback(() => {
    if (startedAtRef.current === null) {
      startedAtRef.current = performance.now();
    }
  }, []);

  const stop = useCallback(() => {
    if (startedAtRef.current === null) return;
    setElapsedMs(performance.now() - startedAtRef.current);
  }, []);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    setElapsedMs(null);
  }, []);

  return { elapsedMs, start, stop, reset };
}
