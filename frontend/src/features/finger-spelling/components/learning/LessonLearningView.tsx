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
import { useFingerSpellingStore } from "@/features/finger-spelling/store";
import { FS_PASS_THRESHOLD } from "@/features/finger-spelling/store/types";
import {
  formatOrderIndex,
  getLessonDisplayLetter,
} from "@/features/finger-spelling/utils/chapter";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors } from "@/theme/theme";
import type { FsChapter, FsLessonDetail, FsUnit } from "../../types";
import LessonFeedbackWidget from "./LessonFeedbackWidget";
import LessonPracticeStep from "./LessonPracticeStep";
import PermissionRequestDialog from "@/components/custom-dialog/permission-request-dialog";

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

type LessonLearningViewProps = {
  lesson: FsLessonDetail;
  unit: FsUnit;
  chapter: FsChapter;
  nextLessonId?: number;
};

export default function LessonLearningView({
  lesson,
  unit,
  chapter,
  nextLessonId,
}: LessonLearningViewProps) {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const latestDetectionRef = useRef<RawHandDetection>(EMPTY_DETECTION);
  const capturingRef = useRef(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isConsentPreviewOpen, setIsConsentPreviewOpen] = useState(true);
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
    initializePracticeSession,
    runPracticeRec,
    completePractice,
  } = useFingerSpellingPracticeActions();
  const accuracy = useFingerSpellingStore((state) => state.accuracy);
  const predictedLetter = useFingerSpellingStore((state) => state.predictedLetter);
  const isSubmitting = useFingerSpellingStore((state) => state.isSubmitting);
  const cameraResetKey = useFingerSpellingStore((state) => state.cameraResetKey);

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

        await runPracticeRec(
          lesson.letterId,
          lesson.id,
          extraction.features,
          extraction.handedness,
          categoryFromUnitTitle(unit.title) ?? undefined,
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
      runPracticeRec,
      t,
      unit.title,
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

  const handleRetry = useCallback(() => {
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
        handleRetry();
      }
    }, AUTO_RETRY_POLL_INTERVAL_MS);
  }, [handleRetry, hasHandInFrame]);

  const retryWhenHandIsReady = useCallback(() => {
    if (hasHandInFrame()) {
      handleRetry();
      return;
    }

    waitForHandThenRetry();
  }, [handleRetry, hasHandInFrame, waitForHandThenRetry]);

  // When accuracy or error is received, start 2s auto-retry timer
  useEffect(() => {
    const hasResult = accuracy != null || recError != null;
    if (hasResult && !isSubmitting && !isCompleting) {
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
  }, [accuracy, recError, isSubmitting, isCompleting, retryWhenHandIsReady, clearAutoRetryTimers]);

  // ── WebSocket lifecycle ───────────────────────────────────────────────

  // Connect / disconnect the WebSocket when the landmarker is ready
  useEffect(() => {
    if (isLandmarkerReady && accuracy == null) {
      connectPredictor();
    }
    return () => {
      disconnectPredictor();
    };
  }, [isLandmarkerReady, accuracy, connectPredictor, disconnectPredictor]);

  // Periodic sampling loop: extract features and send over WebSocket
  const samplingLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLandmarkerReady || predictorState !== "ready" || accuracy != null) {
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
  }, [isLandmarkerReady, predictorState, accuracy, extractFromVideo, sendFeatures, unit.title]);

  // Auto-capture on prediction stability
  useEffect(() => {
    if (capturingRef.current || accuracy != null || isSubmitting) return;

    const pred = livePrediction;
    if (!pred.label || pred.confidence < 30 || pred.label === "No Action") {
      stableLabelRef.current = null;
      stableCountRef.current = 0;
      return;
    }

    if (pred.label === stableLabelRef.current) {
      stableCountRef.current += 1;
      if (stableCountRef.current >= AUTO_CAPTURE_FRAMES) {
        setCapturedPrediction({
          label: pred.label,
          confidence: pred.confidence,
        });
        stableLabelRef.current = null;
        stableCountRef.current = 0;
        void doCaptureFromPrediction();
      }
    } else {
      stableLabelRef.current = pred.label;
      stableCountRef.current = 1;
    }
  }, [livePrediction, accuracy, isSubmitting, doCaptureFromPrediction]);

  // ───────────────────────────────────────────────────────────────────────

  const displayLetter = getLessonDisplayLetter(lesson);
  const trackHref = ROUTES.fingerSpelling.root;

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
    void initializePracticeSession(lesson?.id);
    return () => {
      clearPracticeContext();
    };
  }, [chapter, clearPracticeContext, initializePracticeSession, lesson, nextLessonId, setPracticeContext, unit]);

  const handleDetection = useCallback((detection: RawHandDetection) => {
    latestDetectionRef.current = detection;
  }, []);

  const handleContinue = async () => {
    if (isCompleting) return;

    clearAutoRetryTimers();
    retryPendingRef.current = false;
    setRetryWaiting(false);
    setCapturedPrediction(null);
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

      <LessonPracticeStep
        letter={displayLetter}
        imageUrl={lesson?.imageUrl}
        tip={tip}
        accuracy={accuracy}
        predictedLetter={predictedLetter}
        passThreshold={FS_PASS_THRESHOLD}
        cameraResetKey={cameraResetKey}
        isSubmitting={isSubmitting || isCompleting}
        isContinuing={isCompleting}
        retryWaiting={retryWaiting}
        isLandmarkerReady={isLandmarkerReady}
        recError={recError}
        videoRef={videoRef}
        detectLandmarks={detectLandmarks}
        onDetection={handleDetection}
        // Comment out old stability props — stability-based UI hidden
        stabilityState="idle"
        stabilityProgress={0}
        // Pass live prediction for the MetricCards
        capturedLabel={capturedPrediction?.label ?? null}
        capturedConfidence={capturedPrediction?.confidence ?? null}
        liveLabel={livePrediction.label}
        liveConfidence={livePrediction.confidence}
        predictorReady={predictorState === "ready"}
        onRetry={handleRetry}
        onContinue={handleContinue}
      />
      <LessonFeedbackWidget
        key={lesson.id}
        type="finger_spelling"
        category={unit?.title || unit?.titleKh || ""}
        lessonId={lesson?.id}
        characteristic={displayLetter}
        resultReady={accuracy != null}
      />

      <PermissionRequestDialog
        open={isConsentPreviewOpen}
        title="Help improve the model"
        description="Allow us to use your practice data,asdfadfasdfjhaksdjfhkaljsd aksdhfkjasdh fkjasdh fkasdhfklash fklajshf lashflka shfkasdh fkashf kasdfh akfh askfh aksdhfaks hfkasdhfaksdhfaksdhf klasjhfadbfm,asdbfmasndbfmasdbfamsdhf k ahfkasd hfklasdhf lkasdhffeedback, and prediction results to improve Khmer Sign Language recognition.asdfasdfasdkfaskljdhjfasknfasknfaksjnfilasdnkas kjahklfjash klashhkfas hdkjhasdklfhaslkjfh klasdh fklajsd hkljshfkasd hfkhfkashfkjasiwyribnm,ndasb fm afkahsdkljf  ahsdk f haskjdfhaskl faksfkjasd hfk;jasfoweuropiwqe rhsdfa sdmbcasmbfiw yeia sdfhasdfyweirh abnfnmasdbfweryiuo yklasbfasdmf bkalsdhfiasdh fklashfka sdhfiosdh of pawkf asdkfask; dfh kasdhfkjasdhf [ou r omadfasdf uaefohasdkjfn ,asdnfoasid hfowehasdnfasdhfwoehr asddfasdfawey rasdfe rasdfhasdfbasdmfbbzxmcn,vbamcbvzmxcvbzxmcnvbwiehfkajsdhfkwhiw whoiw hte oasfsahdfakshdfasham i asdhfa-sdfklasdfjlkjasdoakt aopor nopw raksdflaread yunmfadnf,mnzcv,.mnzxcvnwho shnmdsfswho si tyis sare yaoudf asndflasjdfaspalktk ahdskhfaksdfhaskdjfhwhoswr=hwerwerhamsdnf,amsdnfalsdfjo;iwpeir[wirn,vmnzxc,m.vnzx,./fjha;lsdufoa[sduf]p0aeriu[awjejv,./asdnf'lasdhjfo'iaiur]qwe0puir[qwoepuiro,nmzxc.,vnzx.c,vn"
        onClose={() => setIsConsentPreviewOpen(false)}
        onSkip={() => setIsConsentPreviewOpen(false)}
        onAgree={() => setIsConsentPreviewOpen(false)}
      />
    </Stack>
  );
}
