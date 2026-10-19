"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { formatOrderIndex } from "@/features/shared/trackFormat";
import type { WdChapter, WdLessonDetail, WdUnit } from "@/features/word-detection/types";
import {
  useWordDetectionLandmarker,
  WORD_DETECTION_SEQUENCE_LENGTH,
  WORD_DETECTION_TOTAL_FEATURES,
  type WordDetectionLandmarks,
} from "@/features/word-detection/ml/useWordDetectionLandmarker";
import { useWordRealtimePredictor } from "@/features/word-detection/ml/useWordRealtimePredictor";
import { useWordLessonSave } from "@/features/word-detection/hooks/useWordLessonSave";
import { submitWdRecording } from "@/features/word-detection/api/practiceRecordings";
import { WordPredictionStability, WORD_HAND_WARMUP_FRAMES } from "@/features/word-detection/ml/wordPredictionStability";
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
  const stabilityRef = useRef(new WordPredictionStability());
  const handPresentCountRef = useRef(0);
  const samplingLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRetryPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingInFlightRef = useRef(false);
  const recordingSessionRef = useRef({ active: true, canceled: false, prediction: null as {
    label: string; confidence: number; seq: number;
  } | null });
  const navigatingRef = useRef(false);
  const capturedPredictionRef = useRef<typeof capturedPrediction>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [retryWaiting, setRetryWaiting] = useState(false);
  const [rawStream, setRawStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecordingPreviewOpen, setIsRecordingPreviewOpen] = useState(false);
  const [isPermissionOpen, setIsPermissionOpen] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [manualRetryListening, setManualRetryListening] = useState(false);
  const [capturedPrediction, setCapturedPrediction] = useState<{
    label: string;
    confidence: number;
    seq: number;
  } | null>(null);
  const { save: saveProgress, status: saveStatus } = useWordLessonSave(lesson);
  const {
    stopRecording,
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
    noActionLabel: t("PREDICTION.NO_ACTION"),
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

  const handlePermissionClose = useCallback(() => {
    setIsPermissionOpen(false);
  }, []);

  const handlePermissionSkip = useCallback(() => {
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

  // Continue shares this pending write and never navigates before confirmation.
  useEffect(() => {
    if (!continueEnabled || !labelMatches || !capturedPrediction) return;
    void saveProgress(capturedPrediction.confidence, true).catch(() => {
      // The save hook exposes the error. Continue retries the same result.
    });
  }, [capturedPrediction, continueEnabled, labelMatches, saveProgress]);

  const nextHref = `/${locale}${nextLessonId != null ? ROUTES.words.lesson(nextLessonId) : ROUTES.words.root}`;
  useEffect(() => {
    // Prefetch after saving so unlock/progress data reflects the confirmed write.
    if (saveStatus === "saved") router.prefetch(nextHref);
  }, [nextHref, router, saveStatus]);

  const handleContinue = useCallback(async () => {
    if (!continueEnabled || navigatingRef.current) return;
    navigatingRef.current = true;
    setIsCompleting(true);
    try {
      await saveProgress(labelMatches ? capturedPrediction?.confidence ?? 0 : 0, labelMatches);
      router.push(nextHref);
    } catch {
      navigatingRef.current = false;
      setIsCompleting(false);
    }
  }, [capturedPrediction, continueEnabled, labelMatches, nextHref, router, saveProgress]);

  useEffect(() => {
    recordingSessionRef.current.active = true;
    return () => {
      const session = recordingSessionRef.current;
      session.active = false;
      // Only previously agreed, successful donations may outlive the page.
      if (!usePermissionStore.getState().hasAgreed || !session.prediction ||
          session.prediction.confidence < WORD_DONATION_CONFIDENCE_THRESHOLD ||
          session.prediction.label !== lesson.word) {
        session.canceled = true;
        stopRecording();
      }
    };
  }, [lesson.word, stopRecording]);

  const resetPredictionState = useCallback(() => {
    latestDetectionRef.current = EMPTY_WORD_DETECTION;
    stabilityRef.current.reset();
    handPresentCountRef.current = 0;
    setHandDetected(false);
    setCapturedPrediction(null);
    capturedPredictionRef.current = null;
    setRecError(null);
    setRecordedBlob(null);
    setIsRecordingPreviewOpen(false);
    recordingInFlightRef.current = false;
    recordingSessionRef.current.canceled = true;
    stopRecording();
    recordingSessionRef.current = { active: true, canceled: false, prediction: null };
    setRetryWaiting(false);
    resetSequence();
    resetLivePrediction();
  }, [resetLivePrediction, resetSequence, stopRecording]);

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
      queueMicrotask(() => setIsPermissionOpen(true));
    }
  }, [lesson.orderIndex]);

  useEffect(() => {
    // Authenticate in parallel with loading the browser landmark models.
    connectPredictor();
    return () => {
      disconnectPredictor();
    };
  }, [connectPredictor, disconnectPredictor]);

  useEffect(() => {
    if (!isLandmarkerReady || predictorState !== "ready") {
      if (samplingLoopRef.current) {
        clearInterval(samplingLoopRef.current);
        samplingLoopRef.current = null;
      }
      return;
    }

    samplingLoopRef.current = setInterval(() => {
      // Prediction already passed: stop streaming so the server is free for
      // the progress save and next-lesson load.
      if ((continueEnabled && !manualRetryListening) || retryWaiting || capturedPredictionRef.current) return;

      const detection = latestDetectionRef.current;

      // Require the hand to be present for a few consecutive samples before
      // streaming, so a single flicker frame can't trigger a phantom result.
      if (!detection.handDetected || (detection.detectedAt != null && performance.now() - detection.detectedAt > 250)) {
        handPresentCountRef.current = 0;
        setHandDetected(false);
        return;
      }
      handPresentCountRef.current += 1;

      setHandDetected(true);

      if (handPresentCountRef.current < WORD_HAND_WARMUP_FRAMES) {
        return;
      }

      sendFeatures(() => {
        const sequence = detection.sequenceFeatures;
        return sequence?.length === WORD_SEQUENCE_FEATURE_COUNT ? sequence : null;
      }, lesson.word);
    }, WORD_PREDICTION_SAMPLE_INTERVAL_MS);

    return () => {
      if (samplingLoopRef.current) {
        clearInterval(samplingLoopRef.current);
        samplingLoopRef.current = null;
      }
    };
  }, [isLandmarkerReady, lesson.word, predictorState, sendFeatures, continueEnabled, manualRetryListening, retryWaiting]);

  useEffect(() => {
    if ((continueEnabled && !manualRetryListening) || retryWaiting || capturedPredictionRef.current) return;
    // Responses describe the hand-present frames submitted earlier, not the
    // current camera frame. The predictor correlates responses to this attempt;
    // stability uses their sampledAt timestamps, so lowering a hand while the
    // server responds must not discard otherwise valid matching evidence.
    const prediction = livePrediction;
    if (stabilityRef.current.accept(prediction)) {
      const captured = { label: prediction.label!, confidence: prediction.confidence, seq: prediction.seq };
      capturedPredictionRef.current = captured;
      recordingSessionRef.current.prediction = captured;
      setCapturedPrediction(captured);
      setManualRetryListening(false);
      stabilityRef.current.reset();
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

    const session = recordingSessionRef.current;
    recordingInFlightRef.current = true;

    recordForDuration(rawStream, WORD_RECORDING_DURATION_MS)
      .then(async ({ blob }) => {
        if (session.canceled) return;
        // Use ref to get the latest prediction at the time recording finished
        const latestPrediction = session.prediction;
        const predictionMatches =
          latestPrediction &&
          latestPrediction.label === lesson.word &&
          latestPrediction.confidence >= WORD_DONATION_CONFIDENCE_THRESHOLD;

        if (predictionMatches) {
          // Auto-donate when user has previously agreed
          const { hasAgreed } = usePermissionStore.getState();
          if (hasAgreed) {
            // Auto-donate: upload directly without showing preview dialog
            const upload = session.active ? uploadContribution : submitWdRecording;
            await upload({
              video: blob,
              lessonId: lesson.id,
              word: lesson.word,
              predictedLabel: latestPrediction.label,
              confidence: latestPrediction.confidence,
            });
          } else if (session.active) {
            // Show preview dialog for user to choose
            setRecordedBlob(blob);
            setIsRecordingPreviewOpen(true);
          }
        } else if (session.active) {
          // Discard silently - no preview shown
          setRecordedBlob(null);
        }
      })
      .catch((err) => {
        if (session.canceled) return;
        if (!session.active) {
          console.warn("Background word contribution upload failed", err);
          return;
        }
        const message = err instanceof Error ? err.message : "Recording failed.";
        setRecError(message);
      })
      .finally(() => {
        if (recordingSessionRef.current === session) recordingInFlightRef.current = false;
      });
  }, [rawStream, recordForDuration, recordedBlob, isRecordingPreviewOpen, handDetected, lesson.word, lesson.id, continueEnabled, uploadContribution]);

  // Agreed donations keep their full duration without blocking Continue.

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

  const handleDiscardRecording = useCallback(() => {
    setIsRecordingPreviewOpen(false);
    setRecordedBlob(null);
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
        recError={saveStatus === "error" ? t("WORD_DETECTION.LESSON.PROGRESS_SYNC_FAILED") : recError ?? landmarkerError ?? predictorError}
        isContinuing={isCompleting}
        progressSaveStatus={saveStatus}
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
