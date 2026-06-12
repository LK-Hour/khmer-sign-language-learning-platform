"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ROUTES } from "@/constants/routes";
import {
  type RawHandDetection,
  useHandLandmarker,
  useStabilityDetector,
} from "@/features/finger-spelling/ml/useHandLandmarker";
import { useFingerSpellingStore } from "@/features/finger-spelling/store";
import { FS_PASS_THRESHOLD } from "@/features/finger-spelling/store/types";
import {
  formatOrderIndex,
  getLessonDisplayLetter,
} from "@/features/finger-spelling/utils/chapter";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors } from "@/theme/theme";
import type { FsChapter, FsLessonDetail, FsUnit } from "../../types";
import LessonPracticeStep from "./LessonPracticeStep";

const EMPTY_DETECTION: RawHandDetection = { landmarks: [], handednesses: [] };

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
  const [recError, setRecError] = useState<string | null>(null);
  const {
    extractFromVideo,
    detectLandmarks,
    isReady: isLandmarkerReady,
    error: landmarkerError,
  } = useHandLandmarker();

  const setPracticeContext = useFingerSpellingStore(
    (state) => state.setPracticeContext
  );
  const clearPracticeContext = useFingerSpellingStore(
    (state) => state.clearPracticeContext
  );
  const markLessonCompleted = useFingerSpellingStore(
    (state) => state.markLessonCompleted
  );
  const resetPracticeSession = useFingerSpellingStore(
    (state) => state.resetPracticeSession
  );
  const incrementCameraResetKey = useFingerSpellingStore(
    (state) => state.incrementCameraResetKey
  );
  const initializePracticeSession = useFingerSpellingStore(
    (state) => state.initializePracticeSession
  );
  const runPracticeRec = useFingerSpellingStore((state) => state.runPracticeRec);
  const completePractice = useFingerSpellingStore((state) => state.completePractice);
  const accuracy = useFingerSpellingStore((state) => state.accuracy);
  const predictedLetter = useFingerSpellingStore((state) => state.predictedLetter);
  const isSubmitting = useFingerSpellingStore((state) => state.isSubmitting);
  const cameraResetKey = useFingerSpellingStore((state) => state.cameraResetKey);

  // ─── Auto-capture flow ────────────────────────────────────────────
  // 1. Stability detector monitors hand movement
  // 2. When stable for 3s → auto-extract keypoints + send to backend
  // 3. Show result → wait for user to click Retry

  const doCapture = useCallback(async () => {
    const video = videoRef.current;
    setRecError(null);

    if (landmarkerError) {
      setRecError(landmarkerError);
      return;
    }
    if (!isLandmarkerReady) {
      setRecError(t("fsLandmarkerLoading"));
      return;
    }
    if (!video) {
      setRecError(t("fsCameraUnavailable"));
      return;
    }

    try {
      const extraction = extractFromVideo(video);
      if (!extraction.handDetected) {
        setRecError(t("fsNoHandDetected"));
        return;
      }
      await runPracticeRec(lesson.id, extraction.features, extraction.handedness);
    } catch (error) {
      setRecError(
        error instanceof Error ? error.message : "Hand prediction failed"
      );
    }
  }, [extractFromVideo, isLandmarkerReady, landmarkerError, lesson.id, runPracticeRec, t]);

  const handleStable = useCallback(() => {
    void doCapture();
  }, [doCapture]);

  const getLatestDetection = useCallback(() => latestDetectionRef.current, []);

  const { state: stabilityState, progress: stabilityProgress, startMonitoring, stopMonitoring } =
    useStabilityDetector(
      getLatestDetection,
      handleStable,
    );

  useEffect(() => {
    if (isLandmarkerReady && !isSubmitting && accuracy == null) {
      startMonitoring();
    }
  }, [isLandmarkerReady, isSubmitting, accuracy, startMonitoring]);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  const displayLetter = getLessonDisplayLetter(lesson);
  const trackHref = ROUTES.fingerSpelling.root;
  const tip =
    locale === "kh"
      ? lesson.descriptionKh || lesson.description
      : lesson.description || lesson.descriptionKh;

  const unitStep = formatOrderIndex(unit.orderIndex, locale);
  const chapterStep = formatOrderIndex(chapter.orderIndex, locale);
  const lessonStep = formatOrderIndex(lesson.orderIndex, locale);

  useEffect(() => {
    setPracticeContext({ lesson, unit, chapter, nextLessonId });
    void initializePracticeSession(lesson.id);
    return () => {
      clearPracticeContext();
    };
  }, [chapter, clearPracticeContext, initializePracticeSession, lesson, nextLessonId, setPracticeContext, unit]);

  const handleRetry = useCallback(() => {
    setRecError(null);
    latestDetectionRef.current = EMPTY_DETECTION;
    resetPracticeSession();
    incrementCameraResetKey();
    startMonitoring();
  }, [incrementCameraResetKey, resetPracticeSession, startMonitoring]);

  const handleDetection = useCallback((detection: RawHandDetection) => {
    latestDetectionRef.current = detection;
  }, []);

  const handleContinue = async () => {
    await completePractice();
    markLessonCompleted(lesson.id);
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
          {t("navFingerSpelling")}
        </Link>
        <Typography sx={{ color: KslColors.muted, fontWeight: 600 }}>
          {t("fsUnit")} {unitStep}
        </Typography>
        <Typography sx={{ color: KslColors.muted, fontWeight: 600 }}>
          {t("fsChapter")} {chapterStep}
        </Typography>
        <Typography sx={{ color: KslColors.muted, fontWeight: 600 }}>
          {t("fsLesson")} {lessonStep}
        </Typography>
        <Typography sx={{ color: KslColors.textPrimary, fontWeight: 700 }}>
          {t("fsVowel")} {displayLetter}
        </Typography>
      </Breadcrumbs>

      <LessonPracticeStep
        letter={displayLetter}
        imageUrl={lesson.imageUrl}
        tip={tip}
        accuracy={accuracy}
        predictedLetter={predictedLetter}
        passThreshold={FS_PASS_THRESHOLD}
        cameraResetKey={cameraResetKey}
        isSubmitting={isSubmitting}
        isLandmarkerReady={isLandmarkerReady}
        recError={recError}
        videoRef={videoRef}
        detectLandmarks={detectLandmarks}
        onDetection={handleDetection}
        stabilityState={stabilityState}
        stabilityProgress={stabilityProgress}
        onRetry={handleRetry}
        onContinue={handleContinue}
      />
    </Stack>
  );
}
