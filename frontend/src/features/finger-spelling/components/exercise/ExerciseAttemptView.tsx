"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { ROUTES } from "@/constants/routes";
import { MAIN_HEADER_HEIGHT } from "@/components/layout/header-nav";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";
import { useTranslation } from "@/i18n/useTranslation";
import ConfirmDialog from "@/features/admin/components/shared/ConfirmDialog";
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

const EMPTY_PAIRS: Record<string, number> = {};
const EMPTY_IDS: number[] = [];

export default function ExerciseAttemptView({
  session,
  unitId,
  unitTitle,
  isGuest = false,
  onGuestCompleted,
}: Props) {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const questionRefs = useRef<Map<number, HTMLElement>>(new Map());

  const [answers, setAnswers] = useState<Record<number, AnswerState>>(() => {
    const init: Record<number, AnswerState> = {};
    for (const q of session.questions) {
      init[q.exercise_id] = { selectedOptionIds: [], matchingPairs: {} };
    }
    return init;
  });
  const [submittedSession, setSubmittedSession] = useState<ExerciseSessionData | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  const questions = session.questions;

  const isAnswered = useCallback(
    (q: (typeof questions)[number], ans: AnswerState | undefined) => {
      if (!ans) return false;
      if (q.exercise_type === "matching") {
        return Object.keys(ans.matchingPairs).length === q.options.length;
      }
      if (q.exercise_type === "multiple_answer") {
        const required = q.required_selection_count;
        if (required != null && required > 0) {
          return ans.selectedOptionIds.length === required;
        }
        return ans.selectedOptionIds.length > 0;
      }
      return ans.selectedOptionIds.length === 1;
    },
    []
  );

  const answeredFlags = useMemo(() => {
    const flags: Record<number, boolean> = {};
    for (const q of questions) {
      flags[q.exercise_id] = isAnswered(q, answers[q.exercise_id]);
    }
    return flags;
  }, [answers, isAnswered, questions]);

  const totalAnswered = useMemo(
    () => questions.reduce((n, q) => n + (answeredFlags[q.exercise_id] ? 1 : 0), 0),
    [answeredFlags, questions]
  );
  const allAnswered = totalAnswered === questions.length && questions.length > 0;

  const selectOption = useCallback((exerciseId: number, optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        selectedOptionIds: [optionId],
      },
    }));
  }, []);

  const toggleOptionId = useCallback(
    (exerciseId: number, optId: number, maxSelections?: number | null) => {
      setAnswers((prev) => {
        const cur = prev[exerciseId]?.selectedOptionIds ?? [];
        if (cur.includes(optId)) {
          return {
            ...prev,
            [exerciseId]: {
              ...prev[exerciseId],
              selectedOptionIds: cur.filter((id) => id !== optId),
            },
          };
        }
        if (maxSelections != null && cur.length >= maxSelections) {
          return prev;
        }
        return {
          ...prev,
          [exerciseId]: {
            ...prev[exerciseId],
            selectedOptionIds: [...cur, optId],
          },
        };
      });
    },
    []
  );

  const setMatchingPairs = useCallback(
    (exerciseId: number, pairs: Record<string, number>) => {
      setAnswers((prev) => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], matchingPairs: pairs },
      }));
    },
    []
  );

  const matchingHandlers = useMemo(() => {
    const map = new Map<number, (pairs: Record<string, number>) => void>();
    for (const q of questions) {
      if (q.exercise_type !== "matching") continue;
      const exerciseId = q.exercise_id;
      map.set(exerciseId, (pairs) => setMatchingPairs(exerciseId, pairs));
    }
    return map;
  }, [questions, setMatchingPairs]);

  const selectHandlers = useMemo(() => {
    const map = new Map<number, (optionId: number) => void>();
    for (const q of questions) {
      if (
        q.exercise_type !== "multiple_choice" &&
        q.exercise_type !== "true_false"
      ) {
        continue;
      }
      const exerciseId = q.exercise_id;
      map.set(exerciseId, (optionId) => selectOption(exerciseId, optionId));
    }
    return map;
  }, [questions, selectOption]);

  const toggleHandlers = useMemo(() => {
    const map = new Map<number, (optionId: number) => void>();
    for (const q of questions) {
      if (q.exercise_type !== "multiple_answer") continue;
      const exerciseId = q.exercise_id;
      const max = q.required_selection_count;
      map.set(exerciseId, (optionId) => toggleOptionId(exerciseId, optionId, max));
    }
    return map;
  }, [questions, toggleOptionId]);

  function scrollToQuestion(exerciseId: number) {
    const el = questionRefs.current.get(exerciseId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function requestExit() {
    setExitConfirmOpen(true);
  }

  function confirmExit() {
    setExitConfirmOpen(false);
    router.push(ROUTES.fingerSpelling.exercises);
  }

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
      const questionIds = questions.map((q) => q.exercise_id);
      const payload = {
        attempt_id: session.attempt_id,
        question_ids: questionIds,
        answers: submitAnswers,
      };
      const result = isGuest
        ? await submitFsGuestExercise(unitId, payload)
        : await submitFsExercise(unitId, payload);
      if (isGuest) {
        onGuestCompleted?.(result);
      }
      setSubmittedSession(result);
    } catch {
      setSubmitError(t("FINGER_SPELLING.EXERCISE.SUBMIT_ERROR"));
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
    <Stack spacing={0} sx={{ position: "relative", pb: allAnswered ? 12 : 4 }}>
      <ConfirmDialog
        open={exitConfirmOpen}
        onClose={() => setExitConfirmOpen(false)}
        onConfirm={confirmExit}
        title={t("FINGER_SPELLING.EXERCISE.EXIT_CONFIRM_TITLE")}
        message={t("FINGER_SPELLING.EXERCISE.EXIT_CONFIRM_MESSAGE")}
        confirmLabel={t("FINGER_SPELLING.EXERCISE.EXIT_CONFIRM")}
        cancelLabel={t("FINGER_SPELLING.EXERCISE.EXIT_STAY")}
      />

      {/* Sticky interactive progress header */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          position: "sticky",
          top: MAIN_HEADER_HEIGHT,
          zIndex: 20,
          mx: { xs: -1.5, sm: -2, md: 0 },
          mb: 3,
          px: { xs: 1.5, sm: 2, md: 2.5 },
          pt: 1.25,
          pb: 1.5,
          bgcolor: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${KslColors.border}`,
          boxShadow: "0 8px 28px rgba(20, 40, 76, 0.08)",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 1.25, alignItems: "center" }}
        >
          <Button
            variant="text"
            aria-label={t("FINGER_SPELLING.EXERCISE.BACK")}
            onClick={requestExit}
            sx={{
              color: KslColors.textSecondary,
              minWidth: 40,
              width: 40,
              height: 40,
              p: 0,
              borderRadius: "50%",
              outline: "none",
              "&:hover": { bgcolor: KslColors.primaryLighter },
              "&:focus": { outline: "none" },
            }}
          >
            <Icon icon="solar:arrow-left-linear" width={22} />
          </Button>

          <Typography
            noWrap
            sx={{
              flex: 1,
              minWidth: 0,
              fontFamily: fontFamilies.english,
              fontWeight: 700,
              fontSize: { xs: KslFontSizes.md, sm: KslFontSizes.lg },
              color: KslColors.textPrimary,
              letterSpacing: "-0.02em",
            }}
          >
            {unitTitle}
          </Typography>
        </Stack>

        {/* Question chips + completed count */}
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: "center" }}
        >
          <Box
            sx={{
              display: "flex",
              flex: 1,
              minWidth: 0,
              flexWrap: "nowrap",
              gap: 0.75,
              overflowX: "auto",
              pb: 0.25,
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {questions.map((q, index) => {
              const done = answeredFlags[q.exercise_id];
              return (
                <Box
                  key={q.exercise_id}
                  component="button"
                  type="button"
                  onClick={() => scrollToQuestion(q.exercise_id)}
                  aria-label={`Question ${index + 1}${done ? " completed" : ""}`}
                  sx={{
                    flex: "0 0 auto",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: `1.5px solid ${
                      done ? KslColors.primary : KslColors.border
                    }`,
                    bgcolor: done ? KslColors.primary : KslColors.surface,
                    color: done ? "#fff" : KslColors.textSecondary,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontFamily: fontFamilies.english,
                    fontWeight: 800,
                    fontSize: 12,
                    lineHeight: 1,
                    boxShadow: done ? `0 4px 12px ${KslColors.primary}33` : "none",
                    outline: "none",
                    WebkitTapHighlightColor: "transparent",
                    transition:
                      "background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease, transform 0.08s ease",
                    "@media (hover: hover) and (pointer: fine)": {
                      "&:hover": {
                        transform: "translateY(-2px) scale(1.06)",
                      },
                    },
                    "&:active": {
                      transform: "scale(0.94)",
                    },
                  }}
                >
                  {index + 1}
                </Box>
              );
            })}
          </Box>

          <Box
            component={motion.div}
            key={totalAnswered}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            sx={{
              display: "flex",
              alignItems: "baseline",
              gap: 0.35,
              px: 1.35,
              py: 0.65,
              borderRadius: 999,
              bgcolor: allAnswered
                ? KslColors.primaryLight
                : KslColors.secondaryLighter,
              border: `1.5px solid ${
                allAnswered ? KslColors.primary : KslColors.secondary
              }`,
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                fontFamily: fontFamilies.english,
                fontWeight: 800,
                fontSize: { xs: 16, sm: 18 },
                lineHeight: 1,
                color: allAnswered ? KslColors.primary : KslColors.secondary,
              }}
            >
              {totalAnswered}
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: KslFontSizes.sm,
                color: KslColors.textSecondary,
              }}
            >
              / {questions.length}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack spacing={0} divider={<Divider sx={{ borderStyle: "dashed", my: 4 }} />}>
        {questions.map((q, index) => {
          const ans = answers[q.exercise_id];
          const selectedIds = ans?.selectedOptionIds ?? EMPTY_IDS;
          const pairs = ans?.matchingPairs ?? EMPTY_PAIRS;
          const done = answeredFlags[q.exercise_id];
          return (
            <Stack
              key={q.exercise_id}
              ref={(el: HTMLDivElement | null) => {
                if (el) questionRefs.current.set(q.exercise_id, el);
                else questionRefs.current.delete(q.exercise_id);
              }}
              spacing={2}
              sx={{
                scrollMarginTop: MAIN_HEADER_HEIGHT + 120,
              }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: done ? KslColors.primary : KslColors.primaryLight,
                    color: done ? KslColors.surface : KslColors.primary,
                    fontFamily: fontFamilies.english,
                    fontWeight: 700,
                    fontSize: KslFontSizes.sm,
                    lineHeight: 1,
                    flexShrink: 0,
                    transition: "background-color 0.12s ease, color 0.12s ease",
                  }}
                >
                  {index + 1}
                </Box>
                <Stack spacing={0.25}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: KslFontSizes.md,
                      color: KslColors.textPrimary,
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
                </Stack>
              </Stack>

              {q.exercise_type === "multiple_choice" && (
                <ExerciseMultipleChoice
                  question={q}
                  selected={selectedIds[0] ?? null}
                  onSelect={selectHandlers.get(q.exercise_id)!}
                />
              )}
              {q.exercise_type === "true_false" && (
                <ExerciseTrueFalse
                  question={q}
                  selected={selectedIds[0] ?? null}
                  onSelect={selectHandlers.get(q.exercise_id)!}
                />
              )}
              {q.exercise_type === "multiple_answer" && (
                <ExerciseMultipleAnswer
                  question={q}
                  selected={selectedIds}
                  onToggle={toggleHandlers.get(q.exercise_id)!}
                />
              )}
              {q.exercise_type === "matching" && (
                <ExerciseMatching
                  question={q}
                  pairs={pairs}
                  onSetPairs={matchingHandlers.get(q.exercise_id)!}
                />
              )}
            </Stack>
          );
        })}
      </Stack>

      <AnimatePresence>
        {allAnswered && (
          <Stack
            component={motion.div}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            spacing={1}
            sx={{
              position: "sticky",
              bottom: 16,
              mt: 5,
              zIndex: 9,
              alignItems: "center",
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
              disabled={isSubmitting}
              onClick={handleSubmit}
              sx={{
                bgcolor: KslColors.primary,
                color: KslColors.surface,
                fontWeight: 700,
                fontSize: KslFontSizes.md,
                px: 6,
                py: 1.5,
                borderRadius: `${KslRadii.button}px`,
                boxShadow: KslShadows.button,
                outline: "none",
                "&:hover": { bgcolor: KslColors.primaryDark },
                "&:disabled": {
                  bgcolor: KslColors.border,
                  color: KslColors.textSecondary,
                },
                "&:focus": { outline: "none" },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={20} sx={{ color: KslColors.surface }} />
              ) : (
                t("FINGER_SPELLING.EXERCISE.SUBMIT")
              )}
            </Button>
          </Stack>
        )}
      </AnimatePresence>
    </Stack>
  );
}
