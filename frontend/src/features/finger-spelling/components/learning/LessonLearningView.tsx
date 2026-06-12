"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ROUTES } from "@/constants/routes";
import {
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

const COUNTDOWN_SECONDS = 3;

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
  const [recError, setRecError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  // 2. When stable → start countdown (3-2-1)
  // 3. Countdown reaches 0 → auto-extract keypoints + send to backend
  // 4. Show result → wait for user to click Retry

  const doCapture = useCallback(async () => {
    const video = videoRef.current;
    setRecError(null);
    setCountdown(null);

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
    setCountdown(COUNTDOWN_SECONDS);
    let remaining = COUNTDOWN_SECONDS;
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        setCountdown(null);
        void doCapture();
      } else {
        setCountdown(remaining);
        countdownTimerRef.current = setTimeout(tick, 1000);
      }
    };
    countdownTimerRef.current = setTimeout(tick, 1000);
  }, [doCapture]);

  const { state: stabilityState, progress: stabilityProgress, startMonitoring, stopMonitoring } =
    useStabilityDetector(
      () => {
        const video = videoRef.current;
        if (!video) return { landmarks: [], handednesses: [] };
        return detectLandmarks(video);
      },
      handleStable,
    );

  useEffect(() => {
    if (isLandmarkerReady && !isSubmitting && accuracy == null) {
      startMonitoring();
    }
  }, [isLandmarkerReady, isSubmitting, accuracy, startMonitoring]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
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
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
    }
    setCountdown(null);
    setRecError(null);
    resetPracticeSession();
    incrementCameraResetKey();
    startMonitoring();
  }, [incrementCameraResetKey, resetPracticeSession, startMonitoring]);

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
        stabilityState={stabilityState}
        stabilityProgress={stabilityProgress}
        countdown={countdown}
        onRetry={handleRetry}
        onRec={doCapture}
        onContinue={handleContinue}
      />
    </Stack>
  );
}
