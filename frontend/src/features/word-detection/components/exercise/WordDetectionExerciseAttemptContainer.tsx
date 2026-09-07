"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { ROUTES } from "@/constants/routes";
import { MAIN_HEADER_HEIGHT } from "@/components/layout/header-nav";
import { KslColors, KslFontSizes } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/auth.store";
import PracticeCompleteCelebration from "@/features/shared/PracticeCompleteCelebration";
import ExerciseOptionCard, {
  type ExerciseOptionVisualState,
} from "@/features/finger-spelling/components/exercise/ExerciseOptionCard";
import { fetchWdUnit } from "../../api/curriculum";
import { fetchWdUnitExercises, submitWdExerciseAnswer } from "../../api/exercise";
import type { WdUnit } from "../../types";
import type { WdExerciseQuestionData } from "../../types/exercise";
import WdExerciseMedia from "./WdExerciseMedia";

type FetchState = "idle" | "loading" | "ready" | "error";
type QuestionResult = { optionId: number; isCorrect: boolean };

type Props = {
  unitId: number;
};

export default function WordDetectionExerciseAttemptContainer({ unitId }: Props) {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isRefreshing = useAuthStore((state) => state.isRefreshing);

  const questionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const celebrationShownRef = useRef(false);

  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [unit, setUnit] = useState<WdUnit | null>(null);
  const [questions, setQuestions] = useState<WdExerciseQuestionData[]>([]);
  const [results, setResults] = useState<Record<number, QuestionResult>>({});
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const authReady =
    hasHydrated &&
    Boolean(user) &&
    !isRefreshing &&
    (user?.is_guest === true || Boolean(token));

  useEffect(() => {
    if (!authReady) return;

    let ignore = false;
    setFetchState("loading");

    void Promise.all([fetchWdUnit(unitId), fetchWdUnitExercises(unitId)])
      .then(([unitData, exerciseData]) => {
        if (ignore) return;
        if (!unitData || exerciseData.length === 0) {
          setFetchState("error");
          return;
        }
        setUnit(unitData);
        setQuestions(exerciseData);
        setResults({});
        celebrationShownRef.current = false;
        setFetchState("ready");
      })
      .catch(() => {
        if (!ignore) setFetchState("error");
      });

    return () => {
      ignore = true;
    };
  }, [authReady, unitId, user?.id]);

  const isUnlocked = unit?.isExerciseUnlocked ?? false;
  const unitTitle = useMemo(() => {
    if (!unit) return "";
    return locale === "kh" ? unit.titleKh || unit.title : unit.title;
  }, [unit, locale]);

  const answeredCount = Object.keys(results).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const score = useMemo(
    () => Object.values(results).filter((r) => r.isCorrect).length,
    [results]
  );
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const passed = pct >= 60;

  useEffect(() => {
    if (allAnswered && !celebrationShownRef.current) {
      celebrationShownRef.current = true;
      setShowCelebration(true);
    }
  }, [allAnswered]);

  function scrollToQuestion(id: number) {
    questionRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goBackToList() {
    router.push(`/${locale}${ROUTES.words.exercises}`);
  }

  function handleSelectOption(question: WdExerciseQuestionData, optionId: number) {
    if (results[question.id] || pendingId != null) return;
    setPendingId(question.id);
    void submitWdExerciseAnswer(question.id, { selected_option_id: optionId })
      .then((result) => {
        setResults((prev) => ({
          ...prev,
          [question.id]: { optionId, isCorrect: result.is_correct },
        }));
      })
      .finally(() => setPendingId(null));
  }

  if (!authReady || fetchState === "idle" || fetchState === "loading") {
    return (
      <Stack sx={{ alignItems: "center", justifyContent: "center", minHeight: 320, py: 8 }}>
        <CircularProgress sx={{ color: KslColors.primary }} />
      </Stack>
    );
  }

  if (fetchState === "error" || !unit) {
    return (
      <Alert severity="error" sx={{ mx: "auto" }}>
        {t("WORD_DETECTION.TRACK.LOAD_ERROR")}
      </Alert>
    );
  }

  if (!isUnlocked) {
    return (
      <Stack spacing={2} sx={{ alignItems: "center", py: 8, textAlign: "center" }}>
        <Typography variant="h5" sx={{ color: KslColors.textPrimary, fontWeight: 700 }}>
          {t("WORD_DETECTION.EXERCISE_ATTEMPT.LOCKED_TITLE")}
        </Typography>
        <Typography sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.md }}>
          {t("WORD_DETECTION.EXERCISE_LIST.LOCKED_HINT")
            .replace("{{completed}}", String(unit.completedLessonCount ?? 0))
            .replace("{{total}}", String(unit.totalLessonCount ?? 0))}
        </Typography>
        <Button onClick={goBackToList} variant="contained" sx={{ fontWeight: 700, mt: 1 }}>
          {t("WORD_DETECTION.EXERCISE_ATTEMPT.BACK")}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={0} sx={{ position: "relative", pb: 4 }}>
      <Dialog
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              m: { xs: 1.25, sm: 2 },
              maxWidth: { xs: "calc(100% - 20px)", sm: 600 },
              borderRadius: { xs: 2.5, sm: 3.5 },
              overflow: "hidden",
              bgcolor: "transparent",
              boxShadow: "none",
            },
          },
          backdrop: {
            sx: {
              bgcolor: "rgba(20, 40, 76, 0.55)",
              backdropFilter: "blur(6px)",
            },
          },
        }}
      >
        <PracticeCompleteCelebration
          title={
            passed
              ? t("WORD_DETECTION.EXERCISE_ATTEMPT.COMPLETE_TITLE")
              : t("WORD_DETECTION.EXERCISE_ATTEMPT.KEEP_PRACTICING")
          }
          subtitle={`${unitTitle} · ${t("WORD_DETECTION.EXERCISE_ATTEMPT.SCORE_LABEL")
            .replace("{{score}}", String(score))
            .replace("{{total}}", String(questions.length))}`}
          actionLabel={t("WORD_DETECTION.EXERCISE_ATTEMPT.REVIEW_ANSWERS")}
          onAction={() => setShowCelebration(false)}
          avgScore={pct}
          scoreLabel={t("WORD_DETECTION.EXERCISE_ATTEMPT.YOUR_SCORE")}
        />
      </Dialog>

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
        <Stack direction="row" spacing={1} sx={{ mb: 1.25, alignItems: "center" }}>
          <Button
            variant="text"
            aria-label={t("WORD_DETECTION.EXERCISE_ATTEMPT.BACK")}
            onClick={goBackToList}
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

          {allAnswered && (
            <Tooltip title={t("WORD_DETECTION.EXERCISE_ATTEMPT.SEE_RESULT")} arrow>
              <IconButton
                onClick={() => setShowCelebration(true)}
                aria-label={t("WORD_DETECTION.EXERCISE_ATTEMPT.SEE_RESULT")}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: passed ? KslColors.primaryLight : "rgba(243,184,63,0.2)",
                  color: passed ? KslColors.primary : KslColors.inProgress,
                  border: `1.5px solid ${passed ? KslColors.primary : KslColors.inProgress}`,
                }}
              >
                <Icon icon="mdi:trophy-variant" width={18} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Question chips + answered count */}
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
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
              const done = Boolean(results[q.id]);
              return (
                <Box
                  key={q.id}
                  component="button"
                  type="button"
                  onClick={() => scrollToQuestion(q.id)}
                  aria-label={`Question ${index + 1}${done ? " answered" : ""}`}
                  sx={{
                    flex: "0 0 auto",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: `1.5px solid ${done ? KslColors.primary : KslColors.border}`,
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
                      "&:hover": { transform: "translateY(-2px) scale(1.06)" },
                    },
                    "&:active": { transform: "scale(0.94)" },
                  }}
                >
                  {index + 1}
                </Box>
              );
            })}
          </Box>

          <Box
            component={motion.div}
            key={answeredCount}
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
              bgcolor: allAnswered ? KslColors.primaryLight : KslColors.secondaryLighter,
              border: `1.5px solid ${allAnswered ? KslColors.primary : KslColors.secondary}`,
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
              {answeredCount}
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: KslFontSizes.sm, color: KslColors.textSecondary }}
            >
              / {questions.length}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack spacing={0} divider={<Divider sx={{ borderStyle: "dashed", my: 4 }} />}>
        {questions.map((q, index) => {
          const result = results[q.id];
          const questionText = locale === "kh" ? q.question_kh : q.question_en;

          return (
            <Stack
              key={q.id}
              ref={(el: HTMLDivElement | null) => {
                if (el) questionRefs.current.set(q.id, el);
                else questionRefs.current.delete(q.id);
              }}
              spacing={2}
              sx={{ scrollMarginTop: MAIN_HEADER_HEIGHT + 120 }}
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
                    bgcolor: result ? KslColors.primary : KslColors.primaryLight,
                    color: result ? KslColors.surface : KslColors.primary,
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
                <Typography
                  sx={{ fontWeight: 600, fontSize: KslFontSizes.md, color: KslColors.textPrimary }}
                >
                  {questionText}
                </Typography>
              </Stack>

              {q.media ? (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <WdExerciseMedia media={q.media} size={240} />
                </Box>
              ) : null}

              <Stack spacing={1.5}>
                {q.options.map((option) => {
                  const isSelected = result?.optionId === option.id;
                  let state: ExerciseOptionVisualState = "neutral";
                  if (isSelected) {
                    state = result?.isCorrect ? "correct" : "incorrect";
                  }

                  const optionText =
                    locale === "kh"
                      ? option.option_text_kh || option.option_text_en || ""
                      : option.option_text_en || option.option_text_kh || "";

                  return (
                    <ExerciseOptionCard
                      key={option.id}
                      state={state}
                      interactive={!result && pendingId == null}
                      onClick={() => handleSelectOption(q, option.id)}
                    >
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
                        {option.media ? <WdExerciseMedia media={option.media} size={64} /> : null}
                        <Typography sx={{ fontWeight: 700, fontSize: KslFontSizes.md }}>
                          {optionText}
                        </Typography>
                      </Stack>
                    </ExerciseOptionCard>
                  );
                })}
              </Stack>

              {result ? (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    color: result.isCorrect ? KslColors.primary : KslColors.error,
                    fontWeight: 700,
                  }}
                >
                  <Icon
                    icon={result.isCorrect ? "mdi:check-circle" : "mdi:close-circle"}
                    width={20}
                  />
                  <Typography sx={{ fontWeight: 700, fontSize: KslFontSizes.sm }}>
                    {result.isCorrect
                      ? t("WORD_DETECTION.EXERCISE_ATTEMPT.CORRECT")
                      : t("WORD_DETECTION.EXERCISE_ATTEMPT.INCORRECT")}
                  </Typography>
                </Stack>
              ) : null}
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
