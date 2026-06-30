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
import { WORD_DETECTION_PASS_THRESHOLD } from "@/features/word-detection/store/constants";
import { KslColors } from "@/theme/theme";
import { useCallback, useEffect, useRef, useState } from "react";
import WdLessonPracticeStep from "./WordDetectionLessonPracticeStep";

const WORD_PREDICTION_SAMPLE_INTERVAL_MS = 200;
const WORD_AUTO_CAPTURE_FRAMES = 6;
const WORD_MIN_LIVE_CONFIDENCE = 30;
const WORD_SEQUENCE_FEATURE_COUNT =
  WORD_DETECTION_SEQUENCE_LENGTH * WORD_DETECTION_TOTAL_FEATURES;

const EMPTY_WORD_DETECTION: WordDetectionLandmarks = {
  poseLandmarks: [],
  handLandmarks: [],
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const latestDetectionRef = useRef<WordDetectionLandmarks>(EMPTY_WORD_DETECTION);
  const stableLabelRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const samplingLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [capturedPrediction, setCapturedPrediction] = useState<{
    label: string;
    confidence: number;
  } | null>(null);
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

  const resetPredictionState = useCallback(() => {
    latestDetectionRef.current = EMPTY_WORD_DETECTION;
    stableLabelRef.current = null;
    stableCountRef.current = 0;
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
      const sequenceFeatures = latestDetectionRef.current.sequenceFeatures;
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
    const pred = livePrediction;
    if (
      !pred.label ||
      pred.label === "No Action" ||
      pred.confidence < WORD_MIN_LIVE_CONFIDENCE
    ) {
      stableLabelRef.current = null;
      stableCountRef.current = 0;
      return;
    }

    if (pred.label === stableLabelRef.current) {
      stableCountRef.current += 1;
      if (stableCountRef.current >= WORD_AUTO_CAPTURE_FRAMES) {
        setCapturedPrediction({
          label: pred.label,
          confidence: pred.confidence,
        });
        stableLabelRef.current = null;
        stableCountRef.current = 0;
      }
      return;
    }

    stableLabelRef.current = pred.label;
    stableCountRef.current = 1;
  }, [livePrediction]);

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
        wordEn={lesson.wordEn}
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
        videoRef={videoRef}
        detectLandmarks={detectLandmarks}
        isLandmarkerReady={isLandmarkerReady}
        onDetection={handleDetection}
      />
    </Stack>
  );
}
