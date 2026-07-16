"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { ROUTES } from "@/constants/routes";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";
import { useTranslation } from "@/i18n/useTranslation";
import { submitFsExercise, submitFsGuestExercise } from "../../api/curriculum";
import type { ExerciseSessionData, ExerciseAnswerSubmit } from "../../types/exercise";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";
import ExerciseTrueFalse from "./ExerciseTrueFalse";
import ExerciseMultipleAnswer from "./ExerciseMultipleAnswer";
import ExerciseMatching from "./ExerciseMatching";
import ExerciseScoreSummary from "./ExerciseScoreSummary";

type Props = {
  session: ExerciseSessionData;
  unitId: number;
  unitTitle: string;
  isGuest?: boolean;
  onGuestCompleted?: (result: ExerciseSessionData) => void;
};

type AnswerState = {
  selectedOptionIds: number[];
  matchingPairs: Record<string, number>;
};

export default function ExerciseAttemptView({
  session,
  unitId,
  unitTitle,
  isGuest = false,
  onGuestCompleted,
}: Props) {
  const router = useRouter();
  const { locale } = useTranslation();

  const [answers, setAnswers] = useState<Record<number, AnswerState>>(() => {
    const init: Record<number, AnswerState> = {};
    for (const q of session.questions) {
      init[q.exercise_id] = { selectedOptionIds: [], matchingPairs: {} };
    }
    return init;
  });

  const [submittedSession, setSubmittedSession] = useState<ExerciseSessionData | null>(
    session.is_completed ? session : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const questions = session.questions;
  const totalAnswered = questions.filter((q) => {
    const ans = answers[q.exercise_id];
    if (!ans) return false;
    if (q.exercise_type === "matching") {
      return Object.keys(ans.matchingPairs).length === q.options.length;
    }
    return ans.selectedOptionIds.length > 0;
  }).length;

  const allAnswered = totalAnswered === questions.length;

  const setOptionIds = useCallback((exerciseId: number, ids: number[]) => {
    setAnswers((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], selectedOptionIds: ids },
    }));
  }, []);

  const toggleOptionId = useCallback((exerciseId: number, optId: number) => {
    setAnswers((prev) => {
      const cur = prev[exerciseId]?.selectedOptionIds ?? [];
      const next = cur.includes(optId) ? cur.filter((id) => id !== optId) : [...cur, optId];
      return { ...prev, [exerciseId]: { ...prev[exerciseId], selectedOptionIds: next } };
    });
  }, []);

  const setMatchingPairs = useCallback((exerciseId: number, pairs: Record<string, number>) => {
    setAnswers((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], matchingPairs: pairs },
    }));
  }, []);

  async function handleSubmit() {
    if (!allAnswered || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const submitAnswers: ExerciseAnswerSubmit[] = questions.map((q) => {
        const ans = answers[q.exercise_id];
        return {
          exercise_id: q.exercise_id,
          selected_option_ids: ans?.selectedOptionIds ?? [],
          matching_pairs:
            q.exercise_type === "matching" && Object.keys(ans?.matchingPairs ?? {}).length > 0
              ? ans.matchingPairs
              : null,
        };
      });
      const result = isGuest
        ? await submitFsGuestExercise(unitId, {
            attempt_id: session.attempt_id,
            question_ids: questions.map((q) => q.exercise_id),
            answers: submitAnswers,
          })
        : await submitFsExercise(unitId, {
            attempt_id: session.attempt_id,
            answers: submitAnswers,
          });
      if (isGuest) {
        onGuestCompleted?.(result);
      }
      setSubmittedSession(result);
    } catch {
      setSubmitError("Failed to Submit Exercise. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedSession) {
    return (
      <ExerciseScoreSummary
        session={submittedSession}
        unitId={unitId}
        unitTitle={unitTitle}
        onBackToList={() => router.push(ROUTES.fingerSpelling.exercises)}
      />
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <Button
          variant="text"
          startIcon={<Icon icon="solar:arrow-left-linear" />}
          onClick={() => router.push(ROUTES.fingerSpelling.exercises)}
          sx={{ color: KslColors.textSecondary, textTransform: "none" }}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontFamily: fontFamilies.sans,
              fontWeight: 700,
              fontSize: KslFontSizes.xl,
              color: KslColors.textPrimary,
            }}
          >
            {unitTitle}
          </Typography>
          <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.textSecondary }}>
            {totalAnswered} / {questions.length} answered
          </Typography>
        </Box>
      </Box>

      {/* Progress bar */}
      <Box
        sx={{
          width: "100%",
          height: 6,
          bgcolor: KslColors.border,
          borderRadius: 3,
          mb: 4,
          overflow: "hidden",
        }}
      >
        <Box
          component={motion.div}
          animate={{ width: `${(totalAnswered / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
          sx={{ height: "100%", bgcolor: KslColors.primary, borderRadius: 3 }}
        />
      </Box>

      {/* Questions */}
      <Stack spacing={0} divider={<Divider sx={{ borderStyle: "dashed", my: 4 }} />}>
        {questions.map((q, index) => {
          const ans = answers[q.exercise_id] ?? { selectedOptionIds: [], matchingPairs: {} };
          return (
            <Box
              key={q.exercise_id}
              component={motion.div}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              {/* Question header */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    minWidth: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: KslColors.primaryLight,
                    color: KslColors.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: KslFontSizes.sm,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: KslFontSizes.md,
                      color: KslColors.textPrimary,
                      mb: 0.25,
                    }}
                  >
                    {locale === "kh" ? q.question_kh : q.question_en}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: KslFontSizes.xs,
                      color: KslColors.textSecondary,
                      textTransform: "capitalize",
                    }}
                  >
                    {q.exercise_type.replace("_", " ")}
                  </Typography>
                </Box>
              </Box>

              {/* Question body */}
              {q.exercise_type === "multiple_choice" && (
                <ExerciseMultipleChoice
                  question={q}
                  selected={ans.selectedOptionIds[0] ?? null}
                  onSelect={(id) => setOptionIds(q.exercise_id, [id])}
                />
              )}
              {q.exercise_type === "true_false" && (
                <ExerciseTrueFalse
                  question={q}
                  selected={ans.selectedOptionIds[0] ?? null}
                  onSelect={(id) => setOptionIds(q.exercise_id, [id])}
                />
              )}
              {q.exercise_type === "multiple_answer" && (
                <ExerciseMultipleAnswer
                  question={q}
                  selected={ans.selectedOptionIds}
                  onToggle={(id) => toggleOptionId(q.exercise_id, id)}
                />
              )}
              {q.exercise_type === "matching" && (
                <ExerciseMatching
                  question={q}
                  pairs={ans.matchingPairs}
                  onSetPairs={(p) => setMatchingPairs(q.exercise_id, p)}
                />
              )}
            </Box>
          );
        })}
      </Stack>

      {/* Submit */}
      <Box
        sx={{
          position: "sticky",
          bottom: 16,
          mt: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        {submitError && (
          <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.error }}>
            {submitError}
          </Typography>
        )}
        <Button
          variant="contained"
          size="large"
          disabled={!allAnswered || isSubmitting}
          onClick={handleSubmit}
          sx={{
            bgcolor: KslColors.primary,
            color: "#fff",
            fontWeight: 700,
            fontSize: KslFontSizes.md,
            px: 6,
            py: 1.5,
            borderRadius: `${KslRadii.button}px`,
            boxShadow: KslShadows.button,
            "&:hover": { bgcolor: KslColors.primaryDark },
            "&:disabled": { bgcolor: KslColors.border, color: KslColors.textSecondary },
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={20} sx={{ color: "#fff" }} />
          ) : (
            `Submit Exercise${!allAnswered ? ` (${totalAnswered}/${questions.length})` : ""}`
          )}
        </Button>
      </Box>
    </Box>
  );
}