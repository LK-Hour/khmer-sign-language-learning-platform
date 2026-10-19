"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordWordTiming } from "./wordTiming";
import { useAuthStore } from "@/store/auth.store";
import { refreshAuthSession } from "@/utils/api/client";
import { getOrCreateLocalGuestId } from "@/utils/localGuest";

export type WordLivePrediction = {
  label: string | null;
  confidence: number;
  classIndex: number | null;
  targetLabel: string | null;
  labelMatches: boolean | null;
  seq: number;
  sampledAt?: number;
  roundTripMs?: number;
  processingMs?: number;
};

export type WordPredictionConnectionState =
  | "disconnected"
  | "connecting"
  | "authenticating"
  | "ready"
  | "error";

const WS_RECONNECT_DELAY_MS = 500;
const PREDICTION_TIMEOUT_MS = 10000;
const WS_MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_LIVE_PREDICTION: WordLivePrediction = {
  label: null,
  confidence: 0,
  classIndex: null,
  targetLabel: null,
  labelMatches: null,
  seq: 0,
};

function normalizeWordLabel(label: string | null | undefined): string | null {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower === "no_action" || lower === "no action" || lower === "none") {
    return "No Action";
  }
  return trimmed;
}

function normalizeWordConfidence(
  label: string | null | undefined,
  confidence: number | null | undefined,
): number {
  const normalizedLabel = normalizeWordLabel(label);
  if (!normalizedLabel || normalizedLabel === "No Action") {
    return 0;
  }
  return confidence ?? 0;
}

function getWsBaseUrl(): string {
  const restBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
  const proto = restBase.startsWith("https") ? "wss:" : "ws:";
  const hostAndPort = restBase.replace(/^https?:\/\//, "");
  return `${proto}//${hostAndPort}`;
}

export function useWordRealtimePredictor() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<() => void>(() => undefined);
  const seqRef = useRef(0);
  const requestIdRef = useRef(0);
  const attemptIdRef = useRef(0);
  const authenticatedRef = useRef(false);
  const pendingRef = useRef<{
    requestId: number; attemptId: number; sentAt: number;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const clearPending = useCallback(() => {
    if (pendingRef.current) clearTimeout(pendingRef.current.timer);
    pendingRef.current = null;
  }, []);
  const shouldReconnectRef = useRef(false);
  const lastPredictionRef = useRef<WordLivePrediction>(INITIAL_LIVE_PREDICTION);

  const [connectionState, setConnectionState] =
    useState<WordPredictionConnectionState>("disconnected");
  const [livePrediction, setLivePrediction] =
    useState<WordLivePrediction>(INITIAL_LIVE_PREDICTION);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    shouldReconnectRef.current = true;
    const currentSocket = wsRef.current;
    if (
      currentSocket?.readyState === WebSocket.OPEN ||
      currentSocket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    authenticatedRef.current = false;
    clearPending();
    setConnectionState("connecting");
    setError(null);

    const ws = new WebSocket(`${getWsBaseUrl()}/api/word_detection/ws/predict`);
    wsRef.current = ws;

    ws.onopen = async () => {
      if (wsRef.current !== ws) return;
      setConnectionState("authenticating");
      reconnectAttemptRef.current = 0;

      const { user, token } = useAuthStore.getState();
      if (user?.is_guest) {
        ws.send(JSON.stringify({ type: "auth", guestId: getOrCreateLocalGuestId() }));
        return;
      }

      const freshToken = token && !useAuthStore.getState().isTokenExpired()
        ? token
        : await refreshAuthSession();

      if (wsRef.current !== ws) return;
      if (!freshToken || ws.readyState !== WebSocket.OPEN) {
        shouldReconnectRef.current = false;
        setConnectionState("error");
        setError("No authentication found");
        ws.close();
        return;
      }

      ws.send(JSON.stringify({ type: "auth", token: freshToken }));
    };

    ws.onmessage = (event) => {
      if (wsRef.current !== ws) return;
      try {
        const data = JSON.parse(event.data);

        if (data.type === "auth_ok") {
          authenticatedRef.current = true;
          setError(null);
          setConnectionState("ready");
          return;
        }

        if (data.type === "prediction") {
          const pending = pendingRef.current;
          if (!pending || data.requestId !== pending.requestId || data.attemptId !== pending.attemptId) return;
          clearPending();
          // Resetting an attempt leaves its outstanding request bounded, but
          // its response must never enter the new attempt.
          if (pending.attemptId !== attemptIdRef.current) return;
          recordWordTiming("prediction-round-trip", pending.sentAt);
          seqRef.current += 1;
          const label = normalizeWordLabel(data.label ?? null);
          const confidence = normalizeWordConfidence(data.label ?? null, data.confidence);
          const prediction: WordLivePrediction = {
            label,
            confidence,
            classIndex: typeof data.classIndex === "number" ? data.classIndex : null,
            targetLabel: normalizeWordLabel(data.targetLabel ?? null),
            labelMatches: typeof data.labelMatches === "boolean" ? data.labelMatches : null,
            seq: seqRef.current,
            sampledAt: pending.sentAt,
            roundTripMs: performance.now() - pending.sentAt,
            processingMs: data.processingMs,
          };
          setError(null);
          lastPredictionRef.current = prediction;
          setLivePrediction(prediction);
          return;
        }

        if (data.type === "error") {
          const pending = pendingRef.current;
          if (data.requestId != null) {
            if (!pending || data.requestId !== pending.requestId || data.attemptId !== pending.attemptId) return;
            clearPending();
            if (pending.attemptId !== attemptIdRef.current) return;
            // A failed inference can be retried with the next fresh sequence.
            setError(data.message);
            return;
          }
          clearPending();
          shouldReconnectRef.current = false;
          setConnectionState("error");
          setError(data.message);
          return;
        }
      } catch {
        // Ignore malformed messages.
      }
    };

    ws.onerror = () => {
      if (wsRef.current !== ws) return;
      setConnectionState("error");
      setError("WebSocket connection error");
    };

    ws.onclose = (event) => {
      if (wsRef.current !== ws) return;
      authenticatedRef.current = false;
      clearPending();
      if (wsRef.current === ws) {
        setConnectionState("disconnected");
        wsRef.current = null;
      }

      if (event.code === 1008 || event.code === 1011) {
        shouldReconnectRef.current = false;
        setConnectionState("error");
        return;
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
  }, [clearPending]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    authenticatedRef.current = false;
    clearPending();
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
  }, [clearPending]);

  const resetLivePrediction = useCallback(() => {
    attemptIdRef.current += 1;
    lastPredictionRef.current = INITIAL_LIVE_PREDICTION;
    setLivePrediction(INITIAL_LIVE_PREDICTION);
  }, []);

  const sendFeatures = useCallback((
    features: number[] | (() => Float32Array | null), targetLabel?: string,
  ) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !authenticatedRef.current || pendingRef.current) return false;
    // Build/serialize only when the socket is ready to accept fresh work.
    const values = typeof features === "function" ? features() : features;
    if (!values) return false;
    const requestId = ++requestIdRef.current;
    const attemptId = attemptIdRef.current;
    const sentAt = performance.now();
    const timer = setTimeout(() => {
      if (wsRef.current !== ws) return;
      clearPending();
      authenticatedRef.current = false;
      setError("Prediction timed out. Reconnecting…");
      setConnectionState("connecting");
      wsRef.current = null;
      ws.close();
      // Do not wait for the close handshake of an unresponsive connection.
      reconnectTimerRef.current = setTimeout(() => connectRef.current(), WS_RECONNECT_DELAY_MS);
    }, PREDICTION_TIMEOUT_MS);
    pendingRef.current = { requestId, attemptId, sentAt, timer };
    try {
      ws.send(JSON.stringify({
        type: targetLabel ? "predict_label_match" : "predict",
        features: Array.from(values), targetLabel, requestId, attemptId,
      }));
      return true;
    } catch {
      clearPending();
      ws.close();
      return false;
    }
  }, [clearPending]);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    reconnect,
    resetLivePrediction,
    sendFeatures,
    livePrediction,
    lastPredictionRef,
    connectionState,
    error,
  };
}
