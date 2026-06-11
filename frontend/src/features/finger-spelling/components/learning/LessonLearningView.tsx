"use client";

import { Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BackButton from "@/components/ui/BackButton";
import { ROUTES } from "@/constants/routes";
import {
  FS_PASS_THRESHOLD,
  useFingerSpellingStore,
} from "@/features/finger-spelling/store";
import {
  formatOrderIndex,
  getLessonDisplayLetter,
} from "@/features/finger-spelling/utils/chapter";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors } from "@/theme/theme";
import type { FsChapter, FsLessonDetail, FsUnit } from "../../types";
import LessonPracticeStep from "./LessonPracticeStep";

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
  const { t, locale } = useTranslation();

  const setPracticeContext = useFingerSpellingStore(
    (state) => state.setPracticeContext
  );
  const clearPracticeContext = useFingerSpellingStore(
    (state) => state.clearPracticeContext
  );
  const initializePracticeSession = useFingerSpellingStore(
    (state) => state.initializePracticeSession
  );
  const runPracticeRec = useFingerSpellingStore((state) => state.runPracticeRec);
  const completePractice = useFingerSpellingStore(
    (state) => state.completePractice
  );
  const incrementCameraResetKey = useFingerSpellingStore(
    (state) => state.incrementCameraResetKey
  );
  const accuracy = useFingerSpellingStore((state) => state.accuracy);
  const cameraResetKey = useFingerSpellingStore((state) => state.cameraResetKey);
  const isSubmitting = useFingerSpellingStore((state) => state.isSubmitting);

  const displayLetter = getLessonDisplayLetter(lesson);
  const trackHref = ROUTES.fingerSpelling.root;

  const unitStep = formatOrderIndex(unit.orderIndex, locale);
  const chapterStep = formatOrderIndex(chapter.orderIndex, locale);
  const lessonStep = formatOrderIndex(lesson.orderIndex, locale);

  useEffect(() => {
    setPracticeContext({ lesson, unit, chapter, nextLessonId });
    void initializePracticeSession(lesson.id);

    return () => {
      clearPracticeContext();
    };
  }, [
    chapter,
    clearPracticeContext,
    initializePracticeSession,
    lesson,
    nextLessonId,
    setPracticeContext,
    unit,
  ]);

  const handleRec = () => {
    void runPracticeRec(lesson.id);
  };

  const handleContinue = async () => {
    await completePractice();

    if (nextLessonId) {
      router.push(ROUTES.fingerSpelling.lesson(nextLessonId));
      return;
    }

    router.push(trackHref);
  };

  const handleRetry = () => {
    incrementCameraResetKey();
    void runPracticeRec(lesson.id);
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 1200, mx: "auto" }}>
      <BackButton href={trackHref} />

      <Stack spacing={0.5}>
        <Typography
          sx={{
            color: KslColors.primaryDark,
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 0,
          }}
        >
          {t("fsUnit")} {unitStep} / {t("fsChapter")} {chapterStep} /{" "}
          {t("fsLesson")} {lessonStep}
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 26, md: 30 },
            fontWeight: 700,
            color: KslColors.textPrimary,
            lineHeight: 1.15,
          }}
        >
          {t("fsCharacterLabel")}: {displayLetter}
        </Typography>
      </Stack>

      <LessonPracticeStep
        letter={displayLetter}
        imageUrl={lesson.imageUrl}
        accuracy={accuracy}
        passThreshold={FS_PASS_THRESHOLD}
        cameraResetKey={cameraResetKey}
        isSubmitting={isSubmitting}
        onRetry={handleRetry}
        onRec={handleRec}
        onContinue={() => void handleContinue()}
      />
    </Stack>
  );
}
