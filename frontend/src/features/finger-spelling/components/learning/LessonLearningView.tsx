"use client";

import Box from "@mui/material/Box";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ResultCard from "@/components/quiz/ResultCard";
import BackButton from "@/components/ui/BackButton";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { useLocalizedPair } from "@/i18n/useLocalizedPair";
import type { FsLessonDetail } from "../../types";
import LessonIntroStep from "./LessonIntroStep";
import LessonPracticeStep from "./LessonPracticeStep";
import LessonProgressBar from "./LessonProgressBar";

type LessonLearningViewProps = {
  lesson: FsLessonDetail;
  chapterId: number;
  unitId: number;
  nextLessonId?: number;
  lessonIndex: number;
  totalLessons: number;
};

type LessonPhase = "intro" | "practice" | "complete";

const MOCK_ACCURACY = 83;
const ACCURACY_DELAY_MS = 2000;

export default function LessonLearningView({
  lesson,
  chapterId,
  unitId,
  nextLessonId,
  lessonIndex,
  totalLessons,
}: LessonLearningViewProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<LessonPhase>("intro");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [cameraResetKey, setCameraResetKey] = useState(0);

  const descriptionPair = useLocalizedPair(
    lesson.description ?? "",
    lesson.descriptionKh
  );
  const description = descriptionPair.primary || undefined;

  const progressValue = useMemo(() => {
    if (phase === "complete") return lessonIndex + 1;
    if (phase === "practice") return lessonIndex + 0.75;
    return lessonIndex + 0.25;
  }, [phase, lessonIndex]);

  useEffect(() => {
    if (phase !== "practice") {
      setAccuracy(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setAccuracy(MOCK_ACCURACY);
    }, ACCURACY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [phase]);

  const chapterListHref = ROUTES.fingerSpelling.unitChapter(unitId, chapterId);

  const navigateNext = () => {
    if (nextLessonId) {
      router.push(ROUTES.fingerSpelling.lesson(nextLessonId));
      return;
    }
    router.push(chapterListHref);
  };

  const handleRetry = () => {
    setAccuracy(null);
    setCameraResetKey((key) => key + 1);
    window.setTimeout(() => setAccuracy(MOCK_ACCURACY), ACCURACY_DELAY_MS);
  };

  if (phase === "complete") {
    return (
      <ResultCard
        title={t("fsLessonCompleteTitle")}
        subtitle={t("fsLessonCompleteSubtitle")}
        continueLabel={
          nextLessonId ? t("fsNextLesson") : t("fsBackToChapter")
        }
        retakeLabel={t("fsRetakeLesson")}
        onContinue={navigateNext}
        onRetake={() => setPhase("intro")}
      />
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <BackButton href={chapterListHref} />
        <Box sx={{ flex: 1 }}>
          <LessonProgressBar value={progressValue} max={totalLessons} />
        </Box>
      </Box>

      <AnimatePresence mode="wait">
        {phase === "intro" ? (
          <LessonIntroStep
            key="intro"
            letter={lesson.letter}
            romanization={lesson.romanization}
            imageUrl={lesson.imageUrl}
            onContinue={() => setPhase("practice")}
          />
        ) : (
          <LessonPracticeStep
            key="practice"
            letter={lesson.letter}
            romanization={lesson.romanization}
            imageUrl={lesson.imageUrl}
            description={description}
            accuracy={accuracy}
            cameraResetKey={cameraResetKey}
            onRetry={handleRetry}
            onContinue={() => setPhase("complete")}
          />
        )}
      </AnimatePresence>
    </Box>
  );
}
