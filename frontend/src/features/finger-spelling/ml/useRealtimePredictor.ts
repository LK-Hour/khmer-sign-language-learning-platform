"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { refreshAuthSession } from "@/utils/api/client";
import { getOrCreateLocalGuestId } from "@/utils/localGuest";

export type LivePrediction = {
  label: string | null;
  confidence: number;
  handedness: string;
  /** Monotonically increasing sequence number so consumers can detect stale data. */
  seq: number;
};

export type PredictionConnectionState =
  | "disconnected"
  | "connecting"
  | "authenticating"
  | "ready"
  | "error";

const WS_RECONNECT_DELAY_MS = 2000;
const WS_MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_LIVE_PREDICTION: LivePrediction = {
  label: null,
  confidence: 0,
  handedness: "Unknown",
  seq: 0,
};

function normalizePredictionLabel(label: string | null | undefined): string | null {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower === "no action" || lower === "none") {
    return "No Action";
  }
  return trimmed;
}

function normalizePredictionConfidence(
  label: string | null | undefined,
  confidence: number | null | undefined,
): number {
  const normalizedLabel = normalizePredictionLabel(label);
  if (!normalizedLabel || normalizedLabel === "No Action") {
    return 0;
  }
  return confidence ?? 0;
}

/**
 * Derive the WebSocket base URL from the REST API base.
 * `NEXT_PUBLIC_API_URL` must be set to the backend origin, e.g.
 * ``http://localhost:8000``.
 */
function getWsBaseUrl(): string {
  const restBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
  const proto = restBase.startsWith("https") ? "wss:" : "ws:";
  const hostAndPort = restBase.replace(/^https?:\/\//, "");
  return `${proto}//${hostAndPort}`;
}

export function useRealtimePredictor() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<() => void>(() => undefined);
  const seqRef = useRef(0);
  const shouldReconnectRef = useRef(false);
  const lastPredictionRef = useRef<LivePrediction>(INITIAL_LIVE_PREDICTION);

  const [connectionState, setConnectionState] = useState<PredictionConnectionState>("disconnected");
  const [livePrediction, setLivePrediction] = useState<LivePrediction>(INITIAL_LIVE_PREDICTION);
  const [error, setError] = useState<string | null>(null);

  // ── Connect ──────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    shouldReconnectRef.current = true;
    const currentSocket = wsRef.current;
    if (
      currentSocket?.readyState === WebSocket.OPEN ||
      currentSocket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    setConnectionState("connecting");
    setError(null);

    const baseUrl = getWsBaseUrl();
    const ws = new WebSocket(`${baseUrl}/api/finger_spelling/ws/predict`);
    wsRef.current = ws;

    ws.onopen = async () => {
      setConnectionState("authenticating");
      reconnectAttemptRef.current = 0;

      // Send auth immediately on connect
      const { user, token } = useAuthStore.getState();
      const isGuest = user?.is_guest ?? false;
      if (isGuest) {
        ws.send(JSON.stringify({
          type: "auth",
          guestId: getOrCreateLocalGuestId(),
        }));
      } else {
        const freshToken = token && !useAuthStore.getState().isTokenExpired()
          ? token
          : await refreshAuthSession();

        if (!freshToken || ws.readyState !== WebSocket.OPEN) {
          setConnectionState("error");
          setError("No authentication found");
          ws.close();
          return;
        }

        ws.send(JSON.stringify({
          type: "auth",
          token: freshToken,
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "auth_ok") {
          setConnectionState("ready");
          return;
        }

        if (data.type === "prediction") {
          seqRef.current += 1;
          const label = normalizePredictionLabel(data.label ?? null);
          const confidence = normalizePredictionConfidence(data.label ?? null, data.confidence);
          const pred: LivePrediction = {
            label,
            confidence,
            handedness: data.handedness ?? "Unknown",
            seq: seqRef.current,
          };
          lastPredictionRef.current = pred;
          setLivePrediction(pred);
          return;
        }

        if (data.type === "error") {
          setError(data.message);
          return;
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      setConnectionState("error");
      setError("WebSocket connection error");
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        setConnectionState("disconnected");
        wsRef.current = null;
      }

      if (shouldReconnectRef.current) {
        reconnectAttemptRef.current += 1;
        if (reconnectAttemptRef.current >= WS_MAX_RECONNECT_ATTEMPTS) {
          setConnectionState("error");
          setError("WebSocket max reconnection attempts reached");
          return;
        }
        reconnectTimerRef.current = setTimeout(() => {
          connectRef.current();
        }, WS_RECONNECT_DELAY_MS);
      }
    };
  }, []);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // ── Disconnect ───────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptRef.current = 0;
    const ws = wsRef.current;
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
    wsRef.current = null;
    setConnectionState("disconnected");
    setLivePrediction(INITIAL_LIVE_PREDICTION);
    lastPredictionRef.current = INITIAL_LIVE_PREDICTION;
  }, []);

  const resetLivePrediction = useCallback(() => {
    lastPredictionRef.current = INITIAL_LIVE_PREDICTION;
    setLivePrediction(INITIAL_LIVE_PREDICTION);
  }, []);

  // ── Send features for prediction ─────────────────────────────────────
  const sendFeatures = useCallback(
    (features: number[], handedness?: string, category?: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;

      ws.send(
        JSON.stringify({
          type: "predict",
          features,
          handedness: handedness ?? "Unknown",
          category: category ?? undefined,
        })
      );
      return true;
    },
    []
  );

  // ── Reconnect (on demand) ────────────────────────────────────────────
  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  // ── Cleanup on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    /** Connect to the WebSocket (call once or call on mount). */
    connect,
    /** Disconnect from the WebSocket and prevent auto-reconnect. */
    disconnect,
    /** Force reconnection (resets attempt counter). */
    reconnect,
    /** Clear the cached live result before starting a fresh attempt. */
    resetLivePrediction,
    /** Send a 126-feature vector for real-time prediction. */
    sendFeatures,
    /** The latest live prediction received from the server. */
    livePrediction,
    /** A ref to the latest prediction (use inside rAF loops without re-renders). */
    lastPredictionRef,
    /** Current connection state. */
    connectionState,
    /** Any connection or server error message. */
    error,
  };
}
