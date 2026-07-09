"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Button, CircularProgress, Link, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ROUTES } from "@/constants/routes";
import {
  type RawHandDetection,
  useHandLandmarker,
} from "@/features/finger-spelling/ml/useHandLandmarker";
import { useRealtimePredictor } from "@/features/finger-spelling/ml/useRealtimePredictor";
import { useFingerSpellingPracticeActions } from "@/features/finger-spelling/hooks/useFingerSpellingPracticeActions";
import { usePredictionRetry } from "@/features/shared/usePredictionRetry";
import { useFingerSpellingStore } from "@/features/finger-spelling/store";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes } from "@/theme/theme";
import { submitChapterPracticeResult } from "../../api/chapterPracticeResult";
import { resolveApiAssetUrl } from "../../api/config";
import type { FsChapterPractice, FsPracticeItem } from "../../types";
import { useAuthStore } from "@/store/auth.store";
import ChapterPracticeStep from "./ChapterPracticeStep";

const EMPTY_DETECTION: RawHandDetection = { landmarks: [], handednesses: [] };

const categoryFromUnitTitle = (title?: string | null) => title?.trim() || undefined;

const PREDICTION_SAMPLE_INTERVAL_MS = 200;
const AUTO_CAPTURE_FRAMES = 6;
const AUTO_RETRY_DELAY_MS = 1800;
const AUTO_RETRY_POLL_INTERVAL_MS = 300;
const ADVANCE_DELAY_MS = 1000;

/** Unlimited retries — only label match enables advance (no skip after N fails). */
const PRACTICE_MAX_ATTEMPTS = Number.MAX_SAFE_INTEGER;

type ChapterPracticeViewProps = {
  practice: FsChapterPractice;
};

export default function ChapterPracticeView({ practice }: ChapterPracticeViewProps) {
  const router = useRouter();
  const { locale, t } = useTranslation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const latestDetectionRef = useRef<RawHandDetection>(EMPTY_DETECTION);
  const capturingRef = useRef(false);
  const stableLabelRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRetryPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryPendingRef = useRef(false);
  const perLetterScoresRef = useRef<number[]>([]);
  const advancingRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [retryWaiting, setRetryWaiting] = useState(false);
  const [capturedPrediction, setCapturedPrediction] = useState<{
    label: string;
    confidence: number;
  } | null>(null);

  const items = practice.items;
  const currentItem: FsPracticeItem | undefined = items[currentIndex];
  const displayLetter = currentItem?.letterKh ?? "";

  const {
    extractFromVideo,
    detectLandmarks,
    isReady: isLandmarkerReady,
    error: landmarkerError,
  } = useHandLandmarker();

  const {
    connect: connectPredictor,
    disconnect: disconnectPredictor,
    resetLivePrediction,
    sendFeatures,
    livePrediction,
    connectionState: predictorState,
  } = useRealtimePredictor();

  const { runPracticePredict } = useFingerSpellingPracticeActions();
  const accuracy = useFingerSpellingStore((state) => state.accuracy);
  const predictedLetter = useFingerSpellingStore((state) => state.predictedLetter);
  const isSubmitting = useFingerSpellingStore((state) => state.isSubmitting);
  const resetPracticeResult = useFingerSpellingStore((state) => state.resetPracticeResult);

  const retryState = usePredictionRetry({
    targetLabel: displayLetter,
    predictedLabel: predictedLetter,
    confidence: accuracy,
    predictionSeq: accuracy != null ? `${predictedLetter ?? ""}:${accuracy}` : null,
    maxAttempts: PRACTICE_MAX_ATTEMPTS,
    tryAgainLabel: t("BUTTON.TRY_AGAIN"),
  });
  const {
    continueEnabled,
    displayConfidence,
    displayLabel,
    resetAttempts,
    resetForAutoRetry,
    shouldAutoRetry,
  } = retryState;

  const trackHref = ROUTES.fingerSpelling.root;

  const clearAutoRetryTimers = useCallback(() => {
    if (autoRetryTimerRef.current) {
      clearTimeout(autoRetryTimerRef.current);
      autoRetryTimerRef.current = null;
    }
    if (autoRetryPollRef.current) {
      clearInterval(autoRetryPollRef.current);
      autoRetryPollRef.current = null;
    }
  }, []);

  const resetPredictionAttempt = useCallback(() => {
    clearAutoRetryTimers();
    retryPendingRef.current = false;
    setRetryWaiting(false);
    setRecError(null);
    latestDetectionRef.current = EMPTY_DETECTION;
    setCapturedPrediction(null);
    resetPracticeResult();
    resetLivePrediction();
    stableLabelRef.current = null;
    stableCountRef.current = 0;
    capturingRef.current = false;
  }, [clearAutoRetryTimers, resetLivePrediction, resetPracticeResult]);

  const finishSession = useCallback(
    async (scores: number[]) => {
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 100;

      const authUser = useAuthStore.getState().user;
      if (!authUser?.is_guest) {
        setIsSaving(true);
        try {
          await submitChapterPracticeResult(practice.chapterId, {
            avgScore,
            isComplete: true,
          });
        } finally {
          setIsSaving(false);
        }
      }

      useFingerSpellingStore.getState().markPracticeCompleted(practice.chapterId);
      setIsComplete(true);
    },
    [practice.chapterId]
  );

  const advanceToNextLetter = useCallback(
    (score: number) => {
      if (advancingRef.current) return;
      advancingRef.current = true;

      const newScores = [...perLetterScoresRef.current, score];
      perLetterScoresRef.current = newScores;

      window.setTimeout(() => {
        const nextIdx = currentIndex + 1;
        resetPredictionAttempt();
        resetAttempts();
        advancingRef.current = false;

        if (nextIdx >= items.length) {
          void finishSession(newScores);
        } else {
          setCurrentIndex(nextIdx);
        }
      }, ADVANCE_DELAY_MS);
    },
    [currentIndex, finishSession, items.length, resetAttempts, resetPredictionAttempt]
  );

  const doCaptureFromPrediction = useCallback(async () => {
    if (capturingRef.current || advancingRef.current) return;
    capturingRef.current = true;

    try {
      setRecError(null);

      const video = videoRef.current;

      if (landmarkerError) {
        setRecError(landmarkerError);
        return;
      }
      if (!isLandmarkerReady) {
        setRecError(t("FINGER_SPELLING.LESSON.LANDMARKER_LOADING"));
        return;
      }
      if (!video) {
        setRecError(t("FINGER_SPELLING.LESSON.CAMERA_UNAVAILABLE"));
        return;
      }
      if (!currentItem) {
        return;
      }

      const extraction = extractFromVideo(video);
      if (!extraction.handDetected) {
        setRecError(t("FINGER_SPELLING.LESSON.NO_HAND_DETECTED"));
        return;
      }

      await runPracticePredict(
        currentItem.letterId,
        currentItem.lessonId,
        extraction.features,
        extraction.handedness,
        categoryFromUnitTitle(practice.unitTitle) ?? undefined,
        displayLetter,
      );
    } catch (error) {
      setRecError(
        error instanceof Error
          ? error.message
          : t("FINGER_SPELLING.LESSON.HAND_PREDICTION_FAILED")
      );
    } finally {
      capturingRef.current = false;
    }
  }, [
    currentItem,
    displayLetter,
    extractFromVideo,
    isLandmarkerReady,
    landmarkerError,
    practice.unitTitle,
    runPracticePredict,
    t,
  ]);

  const handleAutoRetry = useCallback(() => {
    resetPredictionAttempt();
    resetForAutoRetry();
  }, [resetForAutoRetry, resetPredictionAttempt]);

  const hasHandInFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return false;

    try {
      return extractFromVideo(video).handDetected;
    } catch {
      return false;
    }
  }, [extractFromVideo]);

  const waitForHandThenRetry = useCallback(() => {
    retryPendingRef.current = true;
    if (autoRetryPollRef.current) return;

    autoRetryPollRef.current = setInterval(() => {
      if (hasHandInFrame()) {
        handleAutoRetry();
      }
    }, AUTO_RETRY_POLL_INTERVAL_MS);
  }, [handleAutoRetry, hasHandInFrame]);

  const retryWhenHandIsReady = useCallback(() => {
    if (hasHandInFrame()) {
      handleAutoRetry();
      return;
    }

    waitForHandThenRetry();
  }, [handleAutoRetry, hasHandInFrame, waitForHandThenRetry]);

  // Auto-retry after a failed prediction (same as lesson flow)
  useEffect(() => {
    const hasResult = accuracy != null || recError != null;
    if (hasResult && !isSubmitting && !isComplete && shouldAutoRetry) {
      if (accuracy != null) {
        queueMicrotask(() => {
          setRetryWaiting((current) => current || true);
        });
      }
      autoRetryTimerRef.current = setTimeout(() => {
        retryWhenHandIsReady();
      }, AUTO_RETRY_DELAY_MS);
    }
    return () => {
      clearAutoRetryTimers();
    };
  }, [
    accuracy,
    recError,
    isSubmitting,
    isComplete,
    shouldAutoRetry,
    retryWhenHandIsReady,
    clearAutoRetryTimers,
  ]);

  // Auto-advance on pass instead of showing Continue (practice-specific)
  useEffect(() => {
    if (!continueEnabled || advancingRef.current || isComplete) return;
    advanceToNextLetter(accuracy ?? 0);
  }, [continueEnabled, accuracy, isComplete, advanceToNextLetter]);

  // WebSocket lifecycle — pause while a letter is passed / advancing
  useEffect(() => {
    if (isLandmarkerReady && !continueEnabled && !isComplete) {
      connectPredictor();
    }
    return () => {
      disconnectPredictor();
    };
  }, [isLandmarkerReady, continueEnabled, isComplete, connectPredictor, disconnectPredictor]);

  // Periodic sampling loop
  const samplingLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (
      !isLandmarkerReady ||
      predictorState !== "ready" ||
      continueEnabled ||
      isComplete ||
      !currentItem
    ) {
      if (samplingLoopRef.current) {
        clearInterval(samplingLoopRef.current);
        samplingLoopRef.current = null;
      }
      return;
    }

    samplingLoopRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || capturingRef.current || advancingRef.current) return;

      try {
        const extraction = extractFromVideo(video);

        if (extraction.handDetected) {
          sendFeatures(
            extraction.features,
            extraction.handedness,
            categoryFromUnitTitle(practice.unitTitle) ?? undefined,
            displayLetter,
          );
        }
      } catch {
        // Silently skip failed frames
      }
    }, PREDICTION_SAMPLE_INTERVAL_MS);

    return () => {
      if (samplingLoopRef.current) {
        clearInterval(samplingLoopRef.current);
        samplingLoopRef.current = null;
      }
    };
  }, [
    isLandmarkerReady,
    predictorState,
    continueEnabled,
    isComplete,
    currentItem,
    extractFromVideo,
    sendFeatures,
    practice.unitTitle,
    displayLetter,
  ]);

  // Auto-capture on prediction stability (same thresholds as lesson)
  useEffect(() => {
    if (capturingRef.current || continueEnabled || isSubmitting || advancingRef.current) {
      return;
    }

    const prediction = livePrediction;
    if (!prediction.label || prediction.confidence < 30 || prediction.label === "No Action") {
      stableLabelRef.current = null;
      stableCountRef.current = 0;
      return;
    }

    if (prediction.label === stableLabelRef.current) {
      stableCountRef.current += 1;
      if (stableCountRef.current >= AUTO_CAPTURE_FRAMES) {
        setCapturedPrediction({
          label: prediction.label,
          confidence: prediction.confidence,
        });
        stableLabelRef.current = null;
        stableCountRef.current = 0;
        void doCaptureFromPrediction();
      }
    } else {
      stableLabelRef.current = prediction.label;
      stableCountRef.current = 1;
    }
  }, [livePrediction, continueEnabled, isSubmitting, doCaptureFromPrediction]);

  // Reset retry state when the active letter changes
  useEffect(() => {
    resetAttempts();
    resetPredictionAttempt();
  }, [currentIndex, resetAttempts, resetPredictionAttempt]);

  const handleDetection = useCallback((detection: RawHandDetection) => {
    latestDetectionRef.current = detection;
  }, []);

  const resolvedImageUrl = resolveApiAssetUrl(currentItem?.practiceImageUrl) ?? "";

  if (isComplete) {
    return (
      <Stack
        component={motion.div}
        spacing={4}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        sx={{ alignItems: "center", justifyContent: "center", minHeight: 320, py: 8 }}
      >
        {isSaving ? (
          <CircularProgress />
        ) : (
          <>
            <Typography
              variant="h4"
              sx={{
                color: KslColors.primary,
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              {t("FINGER_SPELLING.PRACTICE.COMPLETE_TITLE")}
            </Typography>
            <Typography
              sx={{
                color: KslColors.textSecondary,
                fontSize: KslFontSizes.md,
                textAlign: "center",
              }}
            >
              {t("FINGER_SPELLING.PRACTICE.COMPLETE_SUBTITLE")}
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push(`/${locale}${trackHref}`)}
              sx={{ fontWeight: 700, minHeight: 46, px: 4 }}
            >
              {t("FINGER_SPELLING.PRACTICE.RETURN_TO_TRACK")}
            </Button>
          </>
        )}
      </Stack>
    );
  }

  const chapterLabel =
    locale === "kh"
      ? practice.chapterTitleKh || practice.chapterTitle
      : practice.chapterTitle || practice.chapterTitleKh;

  const unitLabel =
    locale === "kh"
      ? practice.unitTitleKh || practice.unitTitle
      : practice.unitTitle || practice.unitTitleKh;

  return (
    <Stack spacing={3} sx={{ pb: 6 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        <Link underline="hover" color="inherit" href={`/${locale}${trackHref}`}>
          {t("NAV.FINGER_SPELLING")}
        </Link>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {unitLabel}
        </Typography>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {chapterLabel}
        </Typography>
        <Typography sx={{ color: KslColors.textPrimary, fontWeight: 700 }}>
          {t("FINGER_SPELLING.PRACTICE.CARD_TITLE")}
        </Typography>
      </Breadcrumbs>

      {currentItem ? (
        <ChapterPracticeStep
          item={{ ...currentItem, practiceImageUrl: resolvedImageUrl }}
          letter={displayLetter}
          currentIndex={currentIndex}
          totalItems={items.length}
          accuracy={accuracy}
          isSubmitting={isSubmitting}
          retryWaiting={retryWaiting}
          continueEnabled={continueEnabled}
          displayLabel={displayLabel}
          displayConfidence={displayConfidence}
          isLandmarkerReady={isLandmarkerReady}
          recError={recError}
          videoRef={videoRef}
          detectLandmarks={detectLandmarks}
          onDetection={handleDetection}
          capturedLabel={capturedPrediction?.label ?? null}
          capturedConfidence={capturedPrediction?.confidence ?? null}
          liveLabel={livePrediction.label}
          liveConfidence={livePrediction.confidence}
          liveLabelMatches={livePrediction.labelMatches}
          predictorReady={predictorState === "ready"}
        />
      ) : null}
    </Stack>
  );
}
