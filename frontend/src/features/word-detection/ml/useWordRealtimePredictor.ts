"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
};

export type WordPredictionConnectionState =
  | "disconnected"
  | "connecting"
  | "authenticating"
  | "ready"
  | "error";

const WS_RECONNECT_DELAY_MS = 2000;
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

    setConnectionState("connecting");
    setError(null);

    const ws = new WebSocket(`${getWsBaseUrl()}/api/word_detection/ws/predict`);
    wsRef.current = ws;

    ws.onopen = async () => {
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
      try {
        const data = JSON.parse(event.data);

        if (data.type === "auth_ok") {
          setConnectionState("ready");
          return;
        }

        if (data.type === "prediction") {
          seqRef.current += 1;
          const label = normalizeWordLabel(data.label ?? null);
          const confidence = normalizeWordConfidence(data.label ?? null, data.confidence);
          const pred: WordLivePrediction = {
            label,
            confidence,
            classIndex: typeof data.classIndex === "number" ? data.classIndex : null,
            targetLabel: normalizeWordLabel(data.targetLabel ?? null),
            labelMatches: typeof data.labelMatches === "boolean" ? data.labelMatches : null,
            seq: seqRef.current,
          };
          lastPredictionRef.current = pred;
          setLivePrediction(pred);
          return;
        }

        if (data.type === "error") {
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
      setConnectionState("error");
      setError("WebSocket connection error");
    };

    ws.onclose = (event) => {
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
  }, []);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

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

  const sendFeatures = useCallback((features: number[], targetLabel?: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;

    ws.send(JSON.stringify({
      type: targetLabel ? "predict_label_match" : "predict",
      features,
      targetLabel: targetLabel ?? undefined,
    }));
    return true;
  }, []);

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
