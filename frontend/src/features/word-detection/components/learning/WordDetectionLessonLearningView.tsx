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
import { usePredictionRetry } from "@/features/shared/usePredictionRetry";
import { useWordContributionUpload } from "@/features/word-detection/hooks/useWordContributionUpload";
import { useWordRecording } from "@/features/word-detection/hooks/useWordRecording";
import { KslColors } from "@/theme/theme";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import PermissionRequestDialog from "@/components/custom-dialog/permission-request-dialog";
import { PERMISSION_DIALOG_CONTENT } from "@/constants/permission-dialog";
import { usePermissionStore } from "@/store/permission.store";
import WordDetectionLessonPracticeStep from "./WordDetectionLessonPracticeStep";
import WordRecordingPreview from "./WordRecordingPreview";

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
const WORD_RECORDING_DURATION_MS = 4000;
const WORD_SEQUENCE_FEATURE_COUNT =
  WORD_DETECTION_SEQUENCE_LENGTH * WORD_DETECTION_TOTAL_FEATURES;

const EMPTY_WORD_DETECTION: WordDetectionLandmarks = {
  poseLandmarks: [],
  handLandmarks: [],
  handDetected: false,
  frameFeatures: new Float32Array(0),
  sequenceFeatures: null,
};

type WordDetectionLessonLearningViewProps = {
  lesson: WdLessonDetail;
  unit: WdUnit;
  chapter: WdChapter;
  nextLessonId?: number;
};

export default function WordDetectionLessonLearningView({
  lesson,
  unit,
  chapter,
  nextLessonId,
}: WordDetectionLessonLearningViewProps) {
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
  const recordingInFlightRef = useRef(false);
  const recordingStartTimeRef = useRef<number | null>(null);
  const capturedPredictionRef = useRef<typeof capturedPrediction>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [retryWaiting, setRetryWaiting] = useState(false);
  const [rawStream, setRawStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecordingPreviewOpen, setIsRecordingPreviewOpen] = useState(false);
  const [isPermissionOpen, setIsPermissionOpen] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [handWarmupComplete, setHandWarmupComplete] = useState(false);
  const [manualRetryListening, setManualRetryListening] = useState(false);
  const [capturedPrediction, setCapturedPrediction] = useState<{
    label: string;
    confidence: number;
    seq: number;
  } | null>(null);
  const { completePractice } = useWordDetectionPracticeActions();
  const {
    isRecording,
    error: recordingError,
    recordForDuration,
  } = useWordRecording();
  const {
    isUploading,
    error: uploadError,
    uploadContribution,
  } = useWordContributionUpload();
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

  const handleDetection = useCallback((detection: WordDetectionLandmarks) => {
    latestDetectionRef.current = detection;
  }, []);

  const handleContinue = useCallback(async () => {
    if (isCompleting || isRecording || isUploading) return;

    setIsCompleting(true);
    const accuracy = capturedPrediction?.confidence ?? null;
    const completed = await completePractice(lesson, accuracy, labelMatches);
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
    isRecording,
    isUploading,
    labelMatches,
  ]);

  const resetPredictionState = useCallback(() => {
    latestDetectionRef.current = EMPTY_WORD_DETECTION;
    stableLabelRef.current = null;
    stableCountRef.current = 0;
    handPresentCountRef.current = 0;
    setHandDetected(false);
    setHandWarmupComplete(false);
    setCapturedPrediction(null);
    capturedPredictionRef.current = null;
    setRecError(null);
    setRecordedBlob(null);
    setIsRecordingPreviewOpen(false);
    recordingInFlightRef.current = false;
    recordingStartTimeRef.current = null;
    setRetryWaiting(false);
    resetSequence();
    resetLivePrediction();
  }, [resetLivePrediction, resetSequence]);

  useEffect(() => {
    resetAttempts();
    queueMicrotask(() => {
      setManualRetryListening(false);
      resetPredictionState();
    });
  }, [lesson.id, resetAttempts, resetPredictionState]);

  useEffect(() => {
    if (lesson.orderIndex !== 1) {
      return;
    }

    const { hasAgreed } = usePermissionStore.getState();
    if (!hasAgreed) {
      setIsPermissionOpen(true);
    }
  }, [lesson.orderIndex]);

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

      sendFeatures(Array.from(sequenceFeatures), lesson.word);
    }, WORD_PREDICTION_SAMPLE_INTERVAL_MS);

    return () => {
      if (samplingLoopRef.current) {
        clearInterval(samplingLoopRef.current);
        samplingLoopRef.current = null;
      }
    };
  }, [isLandmarkerReady, lesson.word, predictorState, sendFeatures, handDetected, handWarmupComplete]);

  useEffect(() => {
    if ((continueEnabled && !manualRetryListening) || retryWaiting) return;

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
    capturedPredictionRef.current = capturedPrediction;
  }, [capturedPrediction]);

  useEffect(() => {
    if (!rawStream || recordingInFlightRef.current || !handDetected) return;
    if (recordedBlob || isRecordingPreviewOpen) return;
    if (continueEnabled) return;

    recordingStartTimeRef.current = Date.now();
    recordingInFlightRef.current = true;

    recordForDuration(rawStream, WORD_RECORDING_DURATION_MS)
      .then(({ blob }) => {
        // Use ref to get the latest prediction at the time recording finished
        const latestPrediction = capturedPredictionRef.current;
        const predictionMatches =
          latestPrediction &&
          latestPrediction.label === lesson.word &&
          latestPrediction.confidence >= WORD_DONATION_CONFIDENCE_THRESHOLD;

        if (predictionMatches) {
          // Auto-donate when user has previously agreed
          const { hasAgreed } = usePermissionStore.getState();
          if (hasAgreed) {
            // Auto-donate: upload directly without showing preview dialog
            uploadContribution({
              video: blob,
              lessonId: lesson.id,
              word: lesson.word,
              predictedLabel: latestPrediction.label,
              confidence: latestPrediction.confidence,
            });
          } else {
            // Show preview dialog for user to choose
            setRecordedBlob(blob);
            setIsRecordingPreviewOpen(true);
          }
        } else {
          // Discard silently - no preview shown
          setRecordedBlob(null);
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Recording failed.";
        setRecError(message);
      })
      .finally(() => {
        recordingInFlightRef.current = false;
        recordingStartTimeRef.current = null;
      });
  }, [rawStream, recordForDuration, recordedBlob, isRecordingPreviewOpen, handDetected, lesson.word, lesson.id, continueEnabled, uploadContribution]);

  // Recording no longer stops early on prediction; it runs for full 4s

  useEffect(() => {
    if (
      labelMatches &&
      capturedPrediction &&
      capturedPrediction.confidence >= WORD_DONATION_CONFIDENCE_THRESHOLD
    ) {
      clearAutoRetryTimers();
      queueMicrotask(() => {
        setRetryWaiting(false);
        setRecError(null);
      });
    }
  }, [capturedPrediction, clearAutoRetryTimers, labelMatches]);

  useEffect(() => {
    if (recordingError) {
      queueMicrotask(() => {
        setRecError(recordingError);
      });
    }
  }, [recordingError]);

  const handleDiscardRecording = useCallback((_doNotShowAgain: boolean) => {
    setIsRecordingPreviewOpen(false);
    setRecordedBlob(null);
    setHandWarmupComplete(false);
  }, []);

  const handleUploadRecording = useCallback(
    async (doNotShowAgain: boolean) => {
      if (!recordedBlob || !capturedPrediction) return;

      try {
        await uploadContribution({
          video: recordedBlob,
          lessonId: lesson.id,
          word: lesson.word,
          predictedLabel: capturedPrediction.label,
          confidence: capturedPrediction.confidence,
        });
        if (doNotShowAgain) {
          usePermissionStore.getState().setAgreed();
        }
        setIsRecordingPreviewOpen(false);
        setRecordedBlob(null);
        setHandWarmupComplete(false);
      } catch {
        // The upload hook owns the visible error state and keeps the blob for retry.
      }
    },
    [capturedPrediction, lesson.id, lesson.word, recordedBlob, uploadContribution],
  );

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
      <WordDetectionLessonPracticeStep
        word={lesson.word}
        videoUrl={lesson.videoUrl}
        tip={tip}
        locale={locale}
        nextLessonId={nextLessonId}
        orderIndex={lesson.orderIndex}
        lessonStep={lessonStep}
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
        isContinuing={isCompleting || isRecording || isUploading}
        showRetryButton={continueEnabled && capturedPrediction != null}
        onRetry={handleRetry}
        onContinue={handleContinue}
        videoRef={videoRef}
        detectLandmarks={detectLandmarks}
        isLandmarkerReady={isLandmarkerReady}
        onDetection={handleDetection}
        onRawStreamReady={setRawStream}
      />
      <WordRecordingPreview
        open={isRecordingPreviewOpen}
        videoBlob={recordedBlob}
        word={lesson.word}
        predictedLabel={capturedPrediction?.label ?? null}
        confidence={capturedPrediction?.confidence ?? null}
        isUploading={isUploading}
        uploadError={uploadError}
        onDiscard={handleDiscardRecording}
        onUpload={handleUploadRecording}
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