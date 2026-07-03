"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type PredictionRetryInput = {
  targetLabel: string;
  predictedLabel: string | null;
  confidence: number | null;
  predictionSeq: number | string | null;
  maxAttempts?: number;
  tryAgainLabel: string;
};

function normalizeLabel(label: string | null | undefined): string | null {
  const normalized = label?.trim().replace(/_/g, " ");
  if (!normalized) return null;
  const lower = normalized.toLowerCase();
  if (lower === "no action" || lower === "no_action" || lower === "none") {
    return "No Action";
  }
  return normalized;
}

export function labelsMatch(
  predictedLabel: string | null | undefined,
  targetLabel: string | null | undefined,
): boolean {
  const predicted = normalizeLabel(predictedLabel);
  const target = normalizeLabel(targetLabel);
  return !!predicted && !!target && predicted === target;
}

export function usePredictionRetry({
  targetLabel,
  predictedLabel,
  confidence,
  predictionSeq,
  maxAttempts = 3,
  tryAgainLabel,
}: PredictionRetryInput) {
  const [attemptCount, setAttemptCount] = useState(0);
  const [continueEnabled, setContinueEnabled] = useState(false);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const processedSeqRef = useRef<number | string | null>(null);

  const matched = useMemo(
    () => labelsMatch(predictedLabel, targetLabel),
    [predictedLabel, targetLabel],
  );
  const normalizedPrediction = useMemo(
    () => normalizeLabel(predictedLabel),
    [predictedLabel],
  );
  const isNoAction = normalizedPrediction === "No Action";
  const hasPrediction = predictionSeq != null && normalizedPrediction !== null;

  useEffect(() => {
    if (predictionSeq == null || processedSeqRef.current === predictionSeq) {
      return;
    }
    if (!predictedLabel || normalizeLabel(predictedLabel) === "No Action") {
      return;
    }

    processedSeqRef.current = predictionSeq;
    if (matched) {
      queueMicrotask(() => {
        setContinueEnabled(true);
        setShowTryAgain(false);
      });
      return;
    }

    queueMicrotask(() => {
      setAttemptCount((current) => {
        const next = Math.min(current + 1, maxAttempts);
        if (next >= maxAttempts) {
          setContinueEnabled(true);
        }
        setShowTryAgain(true);
        return next;
      });
    });
  }, [matched, maxAttempts, predictedLabel, predictionSeq]);

  const resetAttempts = useCallback(() => {
    setAttemptCount(0);
    setContinueEnabled(false);
    setShowTryAgain(false);
    processedSeqRef.current = null;
  }, []);

  const resetForAutoRetry = useCallback(() => {
    setShowTryAgain(false);
    processedSeqRef.current = null;
  }, []);

  const displayLabel = useMemo(() => {
    if (matched) return normalizeLabel(targetLabel);
    if (isNoAction) return "No Action";
    if (hasPrediction || showTryAgain) return tryAgainLabel;
    return null;
  }, [hasPrediction, isNoAction, matched, showTryAgain, targetLabel, tryAgainLabel]);

  const displayConfidence = useMemo(() => {
    if (matched) return confidence != null ? Math.round(confidence) : null;
    if (isNoAction) return 0;
    if (hasPrediction || showTryAgain) return 0;
    return null;
  }, [confidence, hasPrediction, isNoAction, matched, showTryAgain]);

  return {
    attemptCount,
    continueEnabled,
    displayConfidence,
    displayLabel,
    labelMatches: matched,
    resetAttempts,
    resetForAutoRetry,
    showTryAgain,
    shouldAutoRetry: showTryAgain && !continueEnabled,
    confidence,
  };
}
