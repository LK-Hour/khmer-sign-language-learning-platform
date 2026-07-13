"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";
import { usePredictionRetry } from "@/features/shared/usePredictionRetry";
import PracticeCompleteCelebration from "@/features/shared/PracticeCompleteCelebration";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/auth.store";
import { KslColors } from "@/theme/theme";
import { submitWdChapterPracticeResult } from "../../api/chapterPracticeResult";
import {
  useWordDetectionLandmarker,
  WORD_DETECTION_SEQUENCE_LENGTH,
  WORD_DETECTION_TOTAL_FEATURES,
  type WordDetectionLandmarks,
} from "../../ml/useWordDetectionLandmarker";
import { useWordRealtimePredictor } from "../../ml/useWordRealtimePredictor";
import { useWordDetectionStore } from "../../store";
import type { WdChapterPractice, WdPracticeItem } from "../../types";
import ChapterPracticeStep from "./ChapterPracticeStep";

const WORD_PREDICTION_SAMPLE_INTERVAL_MS = 100;
const WORD_PASS_STABLE_FRAMES = 6;
const WORD_HAND_WARMUP_FRAMES = 10;
const WORD_AUTO_RETRY_DELAY_MS = 1800;
const WORD_AUTO_RETRY_POLL_INTERVAL_MS = 33;
const ADVANCE_DELAY_MS = 2200;
const PRACTICE_MAX_ATTEMPTS = Number.MAX_SAFE_INTEGER;
const WORD_SEQUENCE_FEATURE_COUNT =
  WORD_DETECTION_SEQUENCE_LENGTH * WORD_DETECTION_TOTAL_FEATURES;

const EMPTY_WORD_DETECTION: WordDetectionLandmarks = {
  poseLandmarks: [],
  handLandmarks: [],
  handDetected: false,
  frameFeatures: new Float32Array(0),
  sequenceFeatures: null,
};

type ChapterPracticeViewProps = {
  practice: WdChapterPractice;
};

export default function ChapterPracticeView({ practice }: ChapterPracticeViewProps) {
  const router = useRouter();
  const { locale, t } = useTranslation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const latestDetectionRef = useRef<WordDetectionLandmarks>(EMPTY_WORD_DETECTION);
  const stableLabelRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const handPresentCountRef = useRef(0);
  const samplingLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRetryPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const perWordScoresRef = useRef<number[]>([]);
  const advancingRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [finalAvgScore, setFinalAvgScore] = useState<number | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [retryWaiting, setRetryWaiting] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [handWarmupComplete, setHandWarmupComplete] = useState(false);
  const [capturedPrediction, setCapturedPrediction] = useState<{
    label: string;
    confidence: number;
    seq: number;
  } | null>(null);

  const items = practice.items;
  const currentItem: WdPracticeItem | undefined = items[currentIndex];
  const displayWord = currentItem?.wordKh ?? "";

  const {
    detectLandmarks,
    resetSequence,
    isReady: isLandmarkerReady,
    error: landmarkerError,
  } = useWordDetectionLandmarker();

  const {
    connect: connectPredictor,
    disconnect: disconnectPredictor,
    resetLivePrediction,
    sendFeatures,
    livePrediction,
    connectionState: predictorState,
    error: predictorError,
  } = useWordRealtimePredictor();

  const retryState = usePredictionRetry({
    targetLabel: displayWord,
    predictedLabel: capturedPrediction?.label ?? null,
    confidence: capturedPrediction?.confidence ?? null,
    predictionSeq: capturedPrediction?.seq ?? null,
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

  const trackHref = ROUTES.words.root;

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
    setRetryWaiting(false);
    setRecError(null);
    latestDetectionRef.current = EMPTY_WORD_DETECTION;
    setCapturedPrediction(null);
    stableLabelRef.current = null;
    stableCountRef.current = 0;
    handPresentCountRef.current = 0;
    setHandDetected(false);
    setHandWarmupComplete(false);
    resetSequence();
    resetLivePrediction();
  }, [clearAutoRetryTimers, resetLivePrediction, resetSequence]);

  const finishSession = useCallback(
    async (scores: number[]) => {
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 100;

      setFinalAvgScore(avgScore);

      const authUser = useAuthStore.getState().user;
      if (!authUser?.is_guest) {
        setIsSaving(true);
        try {
          await submitWdChapterPracticeResult(practice.chapterId, {
            avgScore,
            isComplete: true,
          });
        } finally {
          setIsSaving(false);
        }
      }

      useWordDetectionStore.getState().markPracticeCompleted(practice.chapterId);
      setIsComplete(true);
    },
    [practice.chapterId]
  );

  const advanceToNextWord = useCallback(
    (score: number) => {
      if (advancingRef.current) return;
      advancingRef.current = true;

      const newScores = [...perWordScoresRef.current, score];
      perWordScoresRef.current = newScores;

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

  const handleAutoRetry = useCallback(() => {
    resetPredictionAttempt();
    resetForAutoRetry();
  }, [resetForAutoRetry, resetPredictionAttempt]);

  const hasHandInFrame = useCallback(
    () => latestDetectionRef.current.handDetected,
    []
  );

  const waitForHandThenRetry = useCallback(() => {
    if (autoRetryPollRef.current) return;

    autoRetryPollRef.current = setInterval(() => {
      if (hasHandInFrame()) {
        handleAutoRetry();
      }
    }, WORD_AUTO_RETRY_POLL_INTERVAL_MS);
  }, [handleAutoRetry, hasHandInFrame]);

  const retryWhenHandIsReady = useCallback(() => {
    if (hasHandInFrame()) {
      handleAutoRetry();
      return;
    }
    waitForHandThenRetry();
  }, [handleAutoRetry, hasHandInFrame, waitForHandThenRetry]);

  useEffect(() => {
    if (continueEnabled || isComplete || !shouldAutoRetry) return;

    queueMicrotask(() => {
      setRetryWaiting(true);
    });
    autoRetryTimerRef.current = setTimeout(() => {
      retryWhenHandIsReady();
    }, WORD_AUTO_RETRY_DELAY_MS);

    return () => {
      clearAutoRetryTimers();
    };
  }, [
    clearAutoRetryTimers,
    continueEnabled,
    isComplete,
    retryWhenHandIsReady,
    shouldAutoRetry,
  ]);

  useEffect(() => {
    if (!continueEnabled || advancingRef.current || isComplete) return;
    advanceToNextWord(capturedPrediction?.confidence ?? 0);
  }, [continueEnabled, capturedPrediction, isComplete, advanceToNextWord]);

  useEffect(() => {
    if (isLandmarkerReady && !continueEnabled && !isComplete) {
      connectPredictor();
    }
    return () => {
      disconnectPredictor();
    };
  }, [isLandmarkerReady, continueEnabled, isComplete, connectPredictor, disconnectPredictor]);

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
      const detection = latestDetectionRef.current;

      if (!detection.handDetected) {
        handPresentCountRef.current = 0;
        setHandDetected(false);
        return;
      }
      handPresentCountRef.current += 1;

      if (!handDetected) {
        setHandDetected(true);
      }

      if (handPresentCountRef.current < WORD_HAND_WARMUP_FRAMES) {
        return;
      }

      if (!handWarmupComplete) {
        setHandWarmupComplete(true);
      }

      const sequenceFeatures = detection.sequenceFeatures;
      if (!sequenceFeatures || sequenceFeatures.length !== WORD_SEQUENCE_FEATURE_COUNT) {
        return;
      }

      sendFeatures(Array.from(sequenceFeatures), displayWord);
    }, WORD_PREDICTION_SAMPLE_INTERVAL_MS);

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
    sendFeatures,
    displayWord,
    handDetected,
    handWarmupComplete,
  ]);

  useEffect(() => {
    if (continueEnabled || retryWaiting || advancingRef.current) return;

    const prediction = livePrediction;
    if (!prediction.label || prediction.label === "No Action") {
      stableLabelRef.current = null;
      stableCountRef.current = 0;
      return;
    }

    if (prediction.label === stableLabelRef.current) {
      stableCountRef.current += 1;
    } else {
      stableLabelRef.current = prediction.label;
      stableCountRef.current = 1;
    }

    if (stableCountRef.current >= WORD_PASS_STABLE_FRAMES) {
      setCapturedPrediction({
        label: prediction.label as string,
        confidence: prediction.confidence,
        seq: prediction.seq,
      });
      stableLabelRef.current = null;
      stableCountRef.current = 0;
    }
  }, [continueEnabled, livePrediction, retryWaiting]);

  useEffect(() => {
    resetAttempts();
    resetPredictionAttempt();
  }, [currentIndex, resetAttempts, resetPredictionAttempt]);

  const handleDetection = useCallback((detection: WordDetectionLandmarks) => {
    latestDetectionRef.current = detection;
  }, []);

  const resolvedImageUrl =
    resolveApiAssetUrl(currentItem?.practiceImageUrl) ??
    currentItem?.practiceImageUrl ??
    "";

  if (isComplete) {
    return (
      <PracticeCompleteCelebration
        title={t("WORD_DETECTION.PRACTICE.COMPLETE_TITLE")}
        subtitle={t("WORD_DETECTION.PRACTICE.COMPLETE_SUBTITLE")}
        actionLabel={t("WORD_DETECTION.PRACTICE.RETURN_TO_TRACK")}
        onAction={() => router.push(`/${locale}${trackHref}`)}
        isSaving={isSaving}
        avgScore={finalAvgScore}
        scoreLabel={t("WORD_DETECTION.PRACTICE.AVG_SCORE")}
      />
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
          {t("NAV.WORD_DETECTION")}
        </Link>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {unitLabel}
        </Typography>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {chapterLabel}
        </Typography>
        <Typography sx={{ color: KslColors.textPrimary, fontWeight: 700 }}>
          {t("WORD_DETECTION.PRACTICE.CARD_TITLE")}
        </Typography>
      </Breadcrumbs>

      {currentItem ? (
        <ChapterPracticeStep
          item={{ ...currentItem, practiceImageUrl: resolvedImageUrl }}
          word={displayWord}
          currentIndex={currentIndex}
          totalItems={items.length}
          retryWaiting={retryWaiting}
          continueEnabled={continueEnabled}
          displayLabel={displayLabel}
          displayConfidence={displayConfidence}
          isLandmarkerReady={isLandmarkerReady}
          recError={recError ?? landmarkerError ?? predictorError}
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
