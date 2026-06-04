"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";
import FreeInputQuestion from "@/components/quiz/FreeInputQuestion";
import ImageSelectQuestion from "@/components/quiz/ImageSelectQuestion";
import MultipleChoiceQuestion from "@/components/quiz/MultipleChoiceQuestion";
import QuizHeader from "@/components/quiz/QuizHeader";
import ResultCard from "@/components/quiz/ResultCard";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import {
  useFsChapterExercise,
  useSubmitFsExercise,
} from "../../hooks/useFsPractice";
import { useQuizStore } from "../../store/quizStore";
import type { FsQuizSubmitAnswer } from "../../types";
import FingerSpellingShell from "../FingerSpellingShell";

type QuizShellProps = {
  chapterId: number;
};

export default function QuizShell({ chapterId }: QuizShellProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: exercise, isLoading } = useFsChapterExercise(chapterId);
  const submitMutation = useSubmitFsExercise(chapterId);

  const {
    status,
    questionIndex,
    score,
    selections,
    freeText,
    start,
    selectOption,
    setFreeText,
    nextQuestion,
    complete,
    reset,
    currentQuestion,
  } = useQuizStore();

  useEffect(() => {
    if (exercise && status === "idle") {
      start(chapterId, exercise);
    }
  }, [exercise, chapterId, start, status]);

  const question = currentQuestion();
  const totalQuestions = exercise?.questions.length ?? 1;
  const progressPercent = Math.round(
    ((questionIndex + (status === "completed" ? 1 : 0)) / totalQuestions) * 100
  );
  const displayPoints = useMemo(() => {
    if (status === "completed") return score;
    return Math.round((questionIndex / totalQuestions) * 60);
  }, [status, score, questionIndex, totalQuestions]);

  const handleCheck = async () => {
    if (!question || !exercise) return;

    if (question.type === "FREE_INPUT") {
      const text = freeText[question.id]?.trim();
      if (!text) return;
    } else if (!selections[question.id]) {
      return;
    }

    if (questionIndex + 1 >= exercise.questions.length) {
      const answers: FsQuizSubmitAnswer[] = exercise.questions.map((q) => ({
        questionId: q.id,
        exerciseId: Number(q.id),
        selectedOptionId: selections[q.id],
        selectedBackendOptionId: selections[q.id]
          ? Number(selections[q.id])
          : undefined,
        freeText: freeText[q.id],
      }));
      const result = await submitMutation.mutateAsync(answers);
      complete(result.score);
      return;
    }
    nextQuestion();
  };

  if (isLoading || !exercise) {
    return (
      <FingerSpellingShell
        title={t("fsExerciseTitle")}
        subtitle={t("loading")}
        hideBottomNav
        headerVariant="exercise"
        fullWidth
      >
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </FingerSpellingShell>
    );
  }

  if (status === "completed") {
    return (
      <FingerSpellingShell
        title={exercise.title}
        subtitle={exercise.subtitle}
        hideBottomNav
        headerVariant="exercise"
        fullWidth
      >
        <ResultCard
          title={t("fsExerciseCompleteTitle")}
          subtitle={t("fsExerciseCompleteSubtitle")}
          continueLabel={t("fsBackToPractice")}
          retakeLabel={t("fsRetakeExercise")}
          onContinue={() => router.push(ROUTES.fingerSpelling.exercise)}
          onRetake={() => {
            reset();
            start(chapterId, exercise);
          }}
        />
      </FingerSpellingShell>
    );
  }

  return (
    <FingerSpellingShell
      title={exercise.title}
      subtitle={exercise.subtitle}
      hideBottomNav
      headerVariant="exercise"
      fullWidth
    >
      <QuizHeader
        percent={progressPercent}
        points={displayPoints}
        backHref={ROUTES.fingerSpelling.exerciseChapter(chapterId)}
      />

      {question?.type === "MULTIPLE_CHOICE" && (
        <MultipleChoiceQuestion
          question={question}
          selectedId={selections[question.id]}
          onSelect={(id) => selectOption(question.id, id)}
        />
      )}
      {question?.type === "FREE_INPUT" && (
        <FreeInputQuestion
          question={question}
          value={freeText[question.id] ?? ""}
          onChange={(v) => setFreeText(question.id, v)}
        />
      )}
      {question?.type === "IMAGE_SELECT" && (
        <ImageSelectQuestion
          question={question}
          selectedIds={
            selections[question.id] ? [selections[question.id]] : []
          }
          onToggle={(id) => selectOption(question.id, id)}
        />
      )}

      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <PrimaryActionButton
          label={t("fsCheck")}
          onClick={handleCheck}
          disabled={submitMutation.isPending}
        />
      </Box>
    </FingerSpellingShell>
  );
}
