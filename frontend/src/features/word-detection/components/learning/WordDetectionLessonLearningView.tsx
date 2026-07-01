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
import { KslColors } from "@/theme/theme";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import WdLessonPracticeStep from "./WordDetectionLessonPracticeStep";

const WORD_PREDICTION_SAMPLE_INTERVAL_MS = 100;
/** Consecutive live frames matching the target word at >= pass threshold
 *  before we latch a "passed" result (avoids a single flicker frame passing). */
const WORD_PASS_STABLE_FRAMES = 4;
/** Consecutive hand-present samples required before we start streaming, to
 *  avoid a single flicker frame triggering a phantom prediction. */
const WORD_HAND_WARMUP_FRAMES = 0;
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
  const passStreakRef = useRef(0);
  const handPresentCountRef = useRef(0);
  const samplingLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [capturedPrediction, setCapturedPrediction] = useState<{
    label: string;
    confidence: number;
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
    passStreakRef.current = 0;
    handPresentCountRef.current = 0;
    setCapturedPrediction(null);
    setRecError(null);
    resetSequence();
    resetLivePrediction();
  }, [resetLivePrediction, resetSequence]);

  useEffect(() => {
    queueMicrotask(resetPredictionState);
  }, [lesson.id, resetPredictionState]);

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

      sendFeatures(Array.from(sequenceFeatures));
    }, WORD_PREDICTION_SAMPLE_INTERVAL_MS);

    return () => {
      if (samplingLoopRef.current) {
        clearInterval(samplingLoopRef.current);
        samplingLoopRef.current = null;
      }
    };
  }, [isLandmarkerReady, predictorState, sendFeatures]);

  useEffect(() => {
    // Once a passing result is latched, stop re-evaluating so the captured
    // snapshot (and the enabled Continue button) stays stable.
    if (capturedPrediction) return;

    const pred = livePrediction;
    // NOTE: target-word matching is intentionally disabled — we latch on
    // confidence alone for any real live prediction.
    // const targetWord = lesson.word.trim();
    const matchesTarget =
      !!pred.label &&
      pred.label !== "No Action" &&
      // pred.label.trim() === targetWord &&
      pred.confidence >= WORD_DETECTION_PASS_THRESHOLD;

    if (!matchesTarget) {
      passStreakRef.current = 0;
      return;
    }

    passStreakRef.current += 1;
    if (passStreakRef.current >= WORD_PASS_STABLE_FRAMES) {
      setCapturedPrediction({
        label: pred.label as string,
        confidence: pred.confidence,
      });
      passStreakRef.current = 0;
    }
  }, [livePrediction, capturedPrediction, lesson.word]);

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
        liveLabel={livePrediction.label}
        liveConfidence={livePrediction.confidence}
        predictorReady={predictorState === "ready"}
        recError={recError ?? landmarkerError ?? predictorError}
        isContinuing={isCompleting}
        onContinue={handleContinue}
        videoRef={videoRef}
        detectLandmarks={detectLandmarks}
        isLandmarkerReady={isLandmarkerReady}
        onDetection={handleDetection}
      />
    </Stack>
  );
}
