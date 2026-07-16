"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Link, Stack, Typography } from "@mui/material";
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
import {
  formatOrderIndex,
  getLessonDisplayLetter,
} from "@/features/finger-spelling/utils/chapter";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors } from "@/theme/theme";
import type { FsChapter, FsLessonDetail, FsUnit } from "../../types";
import FingerSpellingLessonFeedbackWidget from "./FingerSpellingLessonFeedbackWidget";
import FingerSpellingLessonPracticeStep from "./FingerSpellingLessonPracticeStep";
import PermissionRequestDialog from "@/components/custom-dialog/permission-request-dialog";
import { usePermissionStore } from "@/store/permission.store";
import { PERMISSION_DIALOG_CONTENT } from "@/constants/permission-dialog";

const EMPTY_DETECTION: RawHandDetection = { landmarks: [], handednesses: [] };

const categoryFromUnitTitle = (title?: string | null) => {
  return title?.trim() || undefined;
};

// ─── Realtime prediction helpers ─────────────────────────────────────────

/** How often (in ms) we sample a frame for WebSocket prediction. */
const PREDICTION_SAMPLE_INTERVAL_MS = 200;

/** How many consecutive same predictions trigger auto-capture. */
const AUTO_CAPTURE_FRAMES = 6;

/** Auto-retry delay after a prediction result (ms). */
const AUTO_RETRY_DELAY_MS =  1800;

/** How often to check for a returning hand after the retry delay. */
const AUTO_RETRY_POLL_INTERVAL_MS = 300;

// ─────────────────────────────────────────────────────────────────────────

type FingerSpellingLessonLearningViewProps = {
  lesson: FsLessonDetail;
  unit: FsUnit;
  chapter: FsChapter;
  nextLessonId?: number;
};

export default function FingerSpellingLessonLearningView({
  lesson,
  unit,
  chapter,
  nextLessonId,
}: FingerSpellingLessonLearningViewProps) {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const latestDetectionRef = useRef<RawHandDetection>(EMPTY_DETECTION);
  const capturingRef = useRef(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isPermissionOpen, setIsPermissionOpen] = useState(false);
  const [retryWaiting, setRetryWaiting] = useState(false);
  const [capturedPrediction, setCapturedPrediction] = useState<{
    label: string;
    confidence: number;
  } | null>(null);
  const {
    extractFromVideo,
    detectLandmarks,
    isReady: isLandmarkerReady,
    error: landmarkerError,
  } = useHandLandmarker();

  // ── Realtime WebSocket predictor ──────────────────────────────────────
  const {
    connect: connectPredictor,
    disconnect: disconnectPredictor,
    resetLivePrediction,
    sendFeatures,
    livePrediction,
    connectionState: predictorState,
  } = useRealtimePredictor();

  const setPracticeContext = useFingerSpellingStore(
    (state) => state.setPracticeContext
  );
  const clearPracticeContext = useFingerSpellingStore(
    (state) => state.clearPracticeContext
  );
  const resetPracticeResult = useFingerSpellingStore(
    (state) => state.resetPracticeResult
  );
  const {
    runPracticePredict,
    completePractice,
  } = useFingerSpellingPracticeActions();
  const accuracy = useFingerSpellingStore((state) => state.accuracy);
  const predictedLetter = useFingerSpellingStore((state) => state.predictedLetter);
  const isSubmitting = useFingerSpellingStore((state) => state.isSubmitting);
  const cameraResetKey = useFingerSpellingStore((state) => state.cameraResetKey);
  const displayLetter = getLessonDisplayLetter(lesson);
  const retryState = usePredictionRetry({
    targetLabel: displayLetter,
    predictedLabel: predictedLetter,
    confidence: accuracy,
    predictionSeq: accuracy != null ? `${predictedLetter ?? ""}:${accuracy}` : null,
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

  // ── Prediction-stability auto-capture ─────────────────────────────────
  const stableLabelRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);

  // ── Auto-retry refs ───────────────────────────────────────────────────
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRetryPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryPendingRef = useRef(false);

  // ═══════════════════════════════════════════════════════════════════════
  //  ORIGINAL STABILITY DETECTOR — commented out for realtime path
  // ═══════════════════════════════════════════════════════════════════════
  //
  // const doCapture = useCallback(async () => {
  //   if (capturingRef.current) return;
  //   capturingRef.current = true;
  //
  //   try {
  //     const video = videoRef.current;
  //     setRecError(null);
  //
  //     if (landmarkerError) {
  //       setRecError(landmarkerError);
  //       return;
  //     }
  //     if (!isLandmarkerReady) {
  //       setRecError(t("FINGER_SPELLING.LESSON.LANDMARKER_LOADING"));
  //       return;
  //     }
  //     if (!video) {
  //       setRecError(t("FINGER_SPELLING.LESSON.CAMERA_UNAVAILABLE"));
  //       return;
  //     }
  //
  //     const extraction = extractFromVideo(video);
  //     if (!extraction.handDetected) {
  //       setRecError(t("FINGER_SPELLING.LESSON.NO_HAND_DETECTED"));
  //       return;
  //     }
  //     await runPracticeRec(lesson.letterId, lesson.id, extraction.features, extraction.handedness, categoryFromUnitTitle(unit.title) ?? undefined);
  //   } catch (error) {
  //     setRecError(
  //       error instanceof Error ? error.message : t("FINGER_SPELLING.LESSON.HAND_PREDICTION_FAILED")
  //     );
  //   } finally {
  //     capturingRef.current = false;
  //   }
  // }, [extractFromVideo, isLandmarkerReady, landmarkerError, lesson.id, runPracticeRec, t, unit.title]);
  //
  // const handleStable = useCallback(() => {
  //   void doCapture();
  // }, [doCapture]);
  //
  // const getLatestDetection = useCallback(() => latestDetectionRef.current, []);
  //
  // const { state: stabilityState, progress: stabilityProgress, startMonitoring, stopMonitoring } =
  //   useStabilityDetector(
  //     getLatestDetection,
  //     handleStable,
  //   );
  //
  // useEffect(() => {
  //   if (isLandmarkerReady && !isSubmitting && accuracy == null) {
  //     startMonitoring();
  //   }
  // }, [isLandmarkerReady, isSubmitting, accuracy, startMonitoring]);
  //
  // useEffect(() => {
  //   return () => {
  //     stopMonitoring();
  //   };
  // }, [stopMonitoring]);

  // ═══════════════════════════════════════════════════════════════════════
  //  REALTIME PREDICTION LOOP
  // ═══════════════════════════════════════════════════════════════════════

  const doCaptureFromPrediction = useCallback(
    async () => {
      if (capturingRef.current) return;
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

        // Use the live prediction's features for the submission
        const extraction = extractFromVideo(video);
        if (!extraction.handDetected) {
          setRecError(t("FINGER_SPELLING.LESSON.NO_HAND_DETECTED"));
          return;
        }

        await runPracticePredict(
          lesson.letterId,
          lesson.id,
          extraction.features,
          extraction.handedness,
          categoryFromUnitTitle(unit.title) ?? undefined,
          displayLetter,
        );
      } catch (error) {
        setRecError(
          error instanceof Error ? error.message : t("FINGER_SPELLING.LESSON.HAND_PREDICTION_FAILED"),
        );
      } finally {
        capturingRef.current = false;
      }
    },
    [
      extractFromVideo,
      isLandmarkerReady,
      landmarkerError,
      lesson.letterId,
      lesson.id,
      runPracticePredict,
      t,
      unit.title,
      displayLetter,
    ],
  );

  // ── Auto-retry logic ──────────────────────────────────────────────────

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
  }, [clearAutoRetryTimers, resetLivePrediction, resetPracticeResult]);

  const handleAutoRetry = useCallback(() => {
    resetPredictionAttempt();
    resetForAutoRetry();
  }, [resetForAutoRetry, resetPredictionAttempt]);

  const handleRetry = useCallback(() => {
    resetPredictionAttempt();
    resetAttempts();
  }, [resetAttempts, resetPredictionAttempt]);

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

  // When accuracy or error is received, start 2s auto-retry timer
  useEffect(() => {
    const hasResult = accuracy != null || recError != null;
    if (hasResult && !isSubmitting && !isCompleting && shouldAutoRetry) {
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
    isCompleting,
    shouldAutoRetry,
    retryWhenHandIsReady,
    clearAutoRetryTimers,
  ]);

  // ── WebSocket lifecycle ───────────────────────────────────────────────

  // Connect / disconnect the WebSocket when the landmarker is ready
  useEffect(() => {
    if (isLandmarkerReady && !continueEnabled) {
      connectPredictor();
    }
    return () => {
      disconnectPredictor();
    };
  }, [isLandmarkerReady, continueEnabled, connectPredictor, disconnectPredictor]);

  // Periodic sampling loop: extract features and send over WebSocket
  const samplingLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLandmarkerReady || predictorState !== "ready" || continueEnabled) {
      if (samplingLoopRef.current) {
        clearInterval(samplingLoopRef.current);
        samplingLoopRef.current = null;
      }
      return;
    }

    samplingLoopRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || capturingRef.current) return;

      try {
        const extraction = extractFromVideo(video);

        if (extraction.handDetected) {
          sendFeatures(
            extraction?.features,
            extraction?.handedness,
            categoryFromUnitTitle(unit.title) ?? undefined,
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
    extractFromVideo,
    sendFeatures,
    unit.title,
    displayLetter,
  ]);

  // Auto-capture on prediction stability
  useEffect(() => {
    if (capturingRef.current || continueEnabled || isSubmitting) return;

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

  // ───────────────────────────────────────────────────────────────────────

  const trackHref = ROUTES.fingerSpelling.root;
  const continueLabel =
    nextLessonId != null
      ? t("FINGER_SPELLING.LESSON.CONTINUE_LESSON")
      : t("FINGER_SPELLING.LESSON.COMPLETE_CHAPTER");

  const unitLabel = locale === "kh" ? unit.titleKh || unit.title : unit.title || unit.titleKh;
  const tip =
    locale === "kh"
      ? lesson?.descriptionKh || lesson?.description
      : lesson?.description || lesson?.descriptionKh;

  const unitStep = formatOrderIndex(unit?.orderIndex, locale);
  const chapterStep = formatOrderIndex(chapter?.orderIndex, locale);
  const lessonStep = formatOrderIndex(lesson?.orderIndex, locale);

  useEffect(() => {
    setPracticeContext({ lesson, unit, chapter, nextLessonId });
    resetAttempts();
    return () => {
      clearPracticeContext();
    };
  }, [
    chapter,
    clearPracticeContext,
    lesson,
    nextLessonId,
    resetAttempts,
    setPracticeContext,
    unit,
  ]);

  useEffect(() => {
    if (lesson.orderIndex !== 1) return;
    const { hasAgreed } = usePermissionStore.getState();
    if (!hasAgreed) {
      setIsPermissionOpen(true);
    }
  }, [lesson.orderIndex]);

  const handlePermissionClose = useCallback((_doNotShowAgain: boolean) => {
    setIsPermissionOpen(false);
  }, []);

  const handlePermissionSkip = useCallback((_doNotShowAgain: boolean) => {
    setIsPermissionOpen(false);
  }, []);

  const handlePermissionAgree = useCallback((doNotShowAgain: boolean) => {
    if (doNotShowAgain) {
      usePermissionStore.getState().setAgreed();
    }
    setIsPermissionOpen(false);
  }, []);

  const handleDetection = useCallback((detection: RawHandDetection) => {
    latestDetectionRef.current = detection;
  }, []);

  const handleContinue = async () => {
    if (isCompleting) return;

    clearAutoRetryTimers();
    retryPendingRef.current = false;
    setRetryWaiting(false);
    setCapturedPrediction(null);
    resetAttempts();
    setIsCompleting(true);
    const completed = await completePractice();
    setIsCompleting(false);

    if (!completed) {
      setRecError(t("FINGER_SPELLING.LESSON.PROGRESS_SYNC_FAILED"));
      return;
    }

    if (nextLessonId != null) {
      router.push(`/${locale}/finger-spelling/lessons/${nextLessonId}`);
    } else {
      router.push(`/${locale}${trackHref}`);
    }
  };

  return (
    <Stack spacing={3} sx={{ pb: 6 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        <Link
          underline="hover"
          color="inherit"
          href={`/${locale}${trackHref}`}
        >
          {t("NAV.FINGER_SPELLING")}
        </Link>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {t("FINGER_SPELLING.LABELS.UNIT")} {unitStep}
        </Typography>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {t("FINGER_SPELLING.LABELS.CHAPTER")} {chapterStep}
        </Typography>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {t("FINGER_SPELLING.LABELS.LESSON")} {lessonStep}
        </Typography>
        <Typography sx={{ color: KslColors.textPrimary, fontWeight: 700 }}>
          {unitLabel} {displayLetter}
        </Typography>
      </Breadcrumbs>

      <FingerSpellingLessonPracticeStep
        letter={displayLetter}
        imageUrl={lesson?.imageUrl}
        tip={tip}
        accuracy={accuracy}
        cameraResetKey={cameraResetKey}
        isSubmitting={isSubmitting || isCompleting}
        isContinuing={isCompleting}
        retryWaiting={retryWaiting}
        continueEnabled={continueEnabled}
        displayConfidence={displayConfidence}
        displayLabel={displayLabel}
        isLandmarkerReady={isLandmarkerReady}
        recError={recError}
        videoRef={videoRef}
        detectLandmarks={detectLandmarks}
        onDetection={handleDetection}
        // Comment out old stability props — stability-based UI hidden
        stabilityState="idle"
        stabilityProgress={0}
        continueLabel={continueLabel}
        // Pass live prediction for the MetricCards
        capturedLabel={capturedPrediction?.label ?? null}
        capturedConfidence={capturedPrediction?.confidence ?? null}
        liveLabel={livePrediction.label}
        liveConfidence={livePrediction.confidence}
        liveLabelMatches={livePrediction.labelMatches}
        predictorReady={predictorState === "ready"}
        onRetry={handleRetry}
        onContinue={handleContinue}
      />
      <FingerSpellingLessonFeedbackWidget
        key={lesson.id}
        type="finger_spelling"
        category={unit?.title || unit?.titleKh || ""}
        lessonId={lesson?.id}
        characteristic={displayLetter}
        resultReady={accuracy != null}
      />

      <PermissionRequestDialog
        open={isPermissionOpen}
        title={PERMISSION_DIALOG_CONTENT.title}
        description={PERMISSION_DIALOG_CONTENT.description}
        checkboxLabel={PERMISSION_DIALOG_CONTENT.checkboxLabel}
        skipLabel={PERMISSION_DIALOG_CONTENT.skipLabel}
        agreeLabel={PERMISSION_DIALOG_CONTENT.agreeLabel}
        onClose={handlePermissionClose}
        onSkip={handlePermissionSkip}
        onAgree={handlePermissionAgree}
      />
    </Stack>
  );
}
