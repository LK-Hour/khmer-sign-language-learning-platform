"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { formatOrderIndex } from "@/features/word-detection/utils/chapter";
import type { WdChapter, WdLessonDetail, WdUnit } from "@/features/word-detection/types";
import {
  useWordDetectionLandmarker,
  WORD_DETECTION_SEQUENCE_LENGTH,
  WORD_DETECTION_TOTAL_FEATURES,
  type WordDetectionLandmarks,
} from "@/features/word-detection/ml/useWordDetectionLandmarker";
import { useWordRealtimePredictor } from "@/features/word-detection/ml/useWordRealtimePredictor";
import { useWordDetectionPracticeActions } from "@/features/word-detection/hooks/useWordDetectionPracticeActions";
import { WORD_DETECTION_PASS_THRESHOLD } from "@/features/word-detection/store/constants";
import { usePredictionRetry } from "@/features/shared/usePredictionRetry";
import { KslColors } from "@/theme/theme";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import WdLessonPracticeStep from "./WordDetectionLessonPracticeStep";
import PermissionRequestDialog from "@/components/custom-dialog/permission-request-dialog";

const WORD_PREDICTION_SAMPLE_INTERVAL_MS = 100;
/** Consecutive live frames matching the target word at >= pass threshold
 *  before we latch a "passed" result (avoids a single flicker frame passing). */
const WORD_PASS_STABLE_FRAMES = 6;
/** Consecutive hand-present samples required before we start streaming, to
 *  avoid a single flicker frame triggering a phantom prediction. */
const WORD_HAND_WARMUP_FRAMES = 10;
const WORD_AUTO_RETRY_DELAY_MS = 1800;
const WORD_AUTO_RETRY_POLL_INTERVAL_MS = 33;
const WORD_DONATION_CONFIDENCE_THRESHOLD = 70;
const WORD_SEQUENCE_FEATURE_COUNT =
  WORD_DETECTION_SEQUENCE_LENGTH * WORD_DETECTION_TOTAL_FEATURES;

const EMPTY_WORD_DETECTION: WordDetectionLandmarks = {
  poseLandmarks: [],
  handLandmarks: [],
  handDetected: false,
  frameFeatures: new Float32Array(0),
  sequenceFeatures: null,
};

type WdLessonLearningViewProps = {
  lesson: WdLessonDetail;
  unit: WdUnit;
  chapter: WdChapter;
  nextLessonId?: number;
};

export default function WdLessonLearningView({
  lesson,
  unit,
  chapter,
  nextLessonId,
}: WdLessonLearningViewProps) {
  const { locale, t } = useTranslation();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const latestDetectionRef = useRef<WordDetectionLandmarks>(EMPTY_WORD_DETECTION);
  const stableLabelRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const handPresentCountRef = useRef(0);
  const samplingLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRetryPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const donationPromptShownRef = useRef(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [retryWaiting, setRetryWaiting] = useState(false);
  const [isConsentPreviewOpen, setIsConsentPreviewOpen] = useState(false);
  const [manualRetryListening, setManualRetryListening] = useState(false);
  const [capturedPrediction, setCapturedPrediction] = useState<{
    label: string;
    confidence: number;
    seq: number;
  } | null>(null);
  const { completePractice } = useWordDetectionPracticeActions();
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

  const tip =
    locale === "kh"
      ? lesson.descriptionKh || lesson.description
      : lesson.description || lesson.descriptionKh;

  const unitStep = formatOrderIndex(unit.orderIndex, locale);
  const chapterStep = formatOrderIndex(chapter.orderIndex, locale);
  const lessonStep = formatOrderIndex(lesson.orderIndex, locale);

  const trackHref = ROUTES.words.root;
  const retryState = usePredictionRetry({
    targetLabel: lesson.word,
    predictedLabel: capturedPrediction?.label ?? null,
    confidence: capturedPrediction?.confidence ?? null,
    predictionSeq: capturedPrediction?.seq ?? null,
    tryAgainLabel: t("BUTTON.TRY_AGAIN"),
  });
  const {
    continueEnabled,
    displayConfidence,
    displayLabel,
    labelMatches,
    resetAttempts,
    resetForAutoRetry,
    shouldAutoRetry,
  } = retryState;

  const handleDetection = useCallback((detection: WordDetectionLandmarks) => {
    latestDetectionRef.current = detection;
  }, []);

  const handleContinue = useCallback(async () => {
    if (isCompleting) return;

    setIsCompleting(true);
    const accuracy = capturedPrediction?.confidence ?? null;
    const completed = await completePractice(lesson, accuracy);
    setIsCompleting(false);

    if (!completed) {
      setRecError(t("WORD_DETECTION.LESSON.PROGRESS_SYNC_FAILED"));
      return;
    }

    if (nextLessonId != null) {
      router.push(`/${locale}${ROUTES.words.lesson(nextLessonId)}`);
    } else {
      router.push(`/${locale}${ROUTES.words.root}`);
    }
  }, [
    capturedPrediction,
    completePractice,
    isCompleting,
    lesson,
    locale,
    nextLessonId,
    router,
    t,
  ]);

  const resetPredictionState = useCallback(() => {
    latestDetectionRef.current = EMPTY_WORD_DETECTION;
    stableLabelRef.current = null;
    stableCountRef.current = 0;
    handPresentCountRef.current = 0;
    setCapturedPrediction(null);
    setRecError(null);
    setRetryWaiting(false);
    resetSequence();
    resetLivePrediction();
  }, [resetLivePrediction, resetSequence]);

  useEffect(() => {
    resetAttempts();
    donationPromptShownRef.current = false;
    queueMicrotask(() => {
      setManualRetryListening(false);
      resetPredictionState();
    });
  }, [lesson.id, resetAttempts, resetPredictionState]);

  useEffect(() => {
    if (isLandmarkerReady) {
      connectPredictor();
    }
    return () => {
      disconnectPredictor();
    };
  }, [connectPredictor, disconnectPredictor, isLandmarkerReady]);

  useEffect(() => {
    if (!isLandmarkerReady || predictorState !== "ready") {
      if (samplingLoopRef.current) {
        clearInterval(samplingLoopRef.current);
        samplingLoopRef.current = null;
      }
      return;
    }

    samplingLoopRef.current = setInterval(() => {
      const detection = latestDetectionRef.current;

      // Require the hand to be present for a few consecutive samples before
      // streaming, so a single flicker frame can't trigger a phantom result.
      if (!detection.handDetected) {
        handPresentCountRef.current = 0;
        return;
      }
      handPresentCountRef.current += 1;
      if (handPresentCountRef.current < WORD_HAND_WARMUP_FRAMES) {
        return;
      }

      const sequenceFeatures = detection.sequenceFeatures;
      if (!sequenceFeatures || sequenceFeatures.length !== WORD_SEQUENCE_FEATURE_COUNT) {
        return;
      }

      sendFeatures(Array.from(sequenceFeatures), lesson.word);
    }, WORD_PREDICTION_SAMPLE_INTERVAL_MS);

    return () => {
      if (samplingLoopRef.current) {
        clearInterval(samplingLoopRef.current);
        samplingLoopRef.current = null;
      }
    };
  }, [isLandmarkerReady, lesson.word, predictorState, sendFeatures]);

  useEffect(() => {
    if ((continueEnabled && !manualRetryListening) || retryWaiting) return;

    const pred = livePrediction;
    if (!pred.label || pred.label === "No Action") {
      stableLabelRef.current = null;
      stableCountRef.current = 0;
      return;
    }

    if (pred.label === stableLabelRef.current) {
      stableCountRef.current += 1;
    } else {
      stableLabelRef.current = pred.label;
      stableCountRef.current = 1;
    }

    if (stableCountRef.current >= WORD_PASS_STABLE_FRAMES) {
      setCapturedPrediction({
        label: pred.label as string,
        confidence: pred.confidence,
        seq: pred.seq,
      });
      setManualRetryListening(false);
      stableLabelRef.current = null;
      stableCountRef.current = 0;
    }
  }, [continueEnabled, livePrediction, manualRetryListening, retryWaiting]);

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

  const handleAutoRetry = useCallback(() => {
    clearAutoRetryTimers();
    setRetryWaiting(false);
    resetForAutoRetry();
    resetPredictionState();
    setManualRetryListening(true);
  }, [clearAutoRetryTimers, resetForAutoRetry, resetPredictionState]);

  const handleRetry = useCallback(() => {
    clearAutoRetryTimers();
    setRetryWaiting(false);
    resetAttempts();
    resetPredictionState();
    setManualRetryListening(true);
  }, [clearAutoRetryTimers, resetAttempts, resetPredictionState]);

  const hasHandInFrame = useCallback(() => latestDetectionRef.current.handDetected, []);

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
    if (!shouldAutoRetry || isCompleting) return;

    queueMicrotask(() => {
      setRetryWaiting(true);
    });
    autoRetryTimerRef.current = setTimeout(() => {
      retryWhenHandIsReady();
    }, WORD_AUTO_RETRY_DELAY_MS);

    return () => {
      clearAutoRetryTimers();
    };
  }, [clearAutoRetryTimers, isCompleting, retryWhenHandIsReady, shouldAutoRetry]);

  useEffect(() => {
    if (
      labelMatches &&
      capturedPrediction &&
      capturedPrediction.confidence >= WORD_DONATION_CONFIDENCE_THRESHOLD &&
      !donationPromptShownRef.current
    ) {
      donationPromptShownRef.current = true;
      clearAutoRetryTimers();
      setRetryWaiting(false);
      setIsConsentPreviewOpen(true);
    }
  }, [capturedPrediction, clearAutoRetryTimers, labelMatches]);

  return (
    <Stack spacing={3} sx={{ pb: 6 }}>
      {/* ── Breadcrumbs ─────────────────────────────────────────────── */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        <Link underline="hover" color="inherit" href={`/${locale}${trackHref}`}>
          {t("NAV.WORD_DETECTION")}
        </Link>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {t("WORD_DETECTION.LABELS.UNIT")} {unitStep}
        </Typography>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {t("WORD_DETECTION.LABELS.CHAPTER")} {chapterStep}
        </Typography>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {t("WORD_DETECTION.LABELS.LESSON")} {lessonStep}
        </Typography>
        <Typography sx={{ color: KslColors.textPrimary, fontWeight: 700 }}>
          {lesson.word}
        </Typography>
      </Breadcrumbs>
      {/* ── Main practice layout ─────────────────────────────────────── */}
      <WdLessonPracticeStep
        word={lesson.word}
        videoUrl={lesson.videoUrl}
        tip={tip}
        locale={locale}
        nextLessonId={nextLessonId}
        orderIndex={lesson.orderIndex}
        lessonStep={lessonStep}
        passThreshold={WORD_DETECTION_PASS_THRESHOLD}
        predictedLabel={capturedPrediction?.label ?? null}
        predictedConfidence={capturedPrediction?.confidence ?? null}
        displayConfidence={displayConfidence}
        displayLabel={displayLabel}
        continueEnabled={continueEnabled}
        retryWaiting={retryWaiting}
        liveLabel={livePrediction.label}
        liveConfidence={livePrediction.confidence}
        liveLabelMatches={livePrediction.labelMatches}
        predictorReady={predictorState === "ready"}
        recError={recError ?? landmarkerError ?? predictorError}
        isContinuing={isCompleting}
        showRetryButton={continueEnabled && capturedPrediction != null}
        onRetry={handleRetry}
        onContinue={handleContinue}
        videoRef={videoRef}
        detectLandmarks={detectLandmarks}
        isLandmarkerReady={isLandmarkerReady}
        onDetection={handleDetection}
      />
      <PermissionRequestDialog
        open={isConsentPreviewOpen}
        title="Help improve the model"
        description="Your prediction matched the target with high confidence. You can donate this practice data to help improve Khmer Sign Language recognition."
        donateLabel="Donate My Data"
        agreeLabel="Agree"
        onDonate={() => setIsConsentPreviewOpen(false)}
        onClose={() => setIsConsentPreviewOpen(false)}
        onSkip={() => setIsConsentPreviewOpen(false)}
        onAgree={() => setIsConsentPreviewOpen(false)}
      />
    </Stack>
  );
}
