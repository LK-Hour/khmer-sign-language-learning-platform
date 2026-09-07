"use client";

import { useEffect, useRef } from "react";

export interface UseAutoRefreshOptions {
  /** How often to refetch while the tab is visible, in ms. Defaults to 30s. */
  intervalMs?: number;
  /** Set false to turn auto-refresh off entirely. Defaults to true. */
  enabled?: boolean;
}

/**
 * Keeps data fresh without a manual refresh button: refetches when the tab
 * regains focus/visibility, and polls on an interval while it stays visible.
 * Pass a callback that performs a silent refetch (no loading skeleton, no
 * error state clobbering existing data) so background updates don't flicker.
 */
export function useAutoRefresh(
  refetch: () => void,
  { intervalMs = 30000, enabled = true }: UseAutoRefreshOptions = {},
) {
  // Ref so the effect doesn't need to re-subscribe every time the caller's
  // fetch function identity changes (e.g. when filters/pagination change).
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!enabled) return;

    const refetchIfVisible = () => {
      if (document.visibilityState === "visible") {
        refetchRef.current();
      }
    };

    document.addEventListener("visibilitychange", refetchIfVisible);
    window.addEventListener("focus", refetchIfVisible);
    const interval = setInterval(refetchIfVisible, intervalMs);

    return () => {
      document.removeEventListener("visibilitychange", refetchIfVisible);
      window.removeEventListener("focus", refetchIfVisible);
      clearInterval(interval);
    };
  }, [intervalMs, enabled]);
}
