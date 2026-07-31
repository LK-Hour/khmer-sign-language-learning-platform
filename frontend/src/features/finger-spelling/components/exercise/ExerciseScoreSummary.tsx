"use client";

import { useState } from "react";
import {
  Box,
  Dialog,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { KslColors, KslFontSizes } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";
import { useTranslation } from "@/i18n/useTranslation";
import PracticeCompleteCelebration from "@/features/shared/PracticeCompleteCelebration";
import type { ExerciseSessionData } from "../../types/exercise";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";
import ExerciseTrueFalse from "./ExerciseTrueFalse";
import ExerciseMultipleAnswer from "./ExerciseMultipleAnswer";
import ExerciseMatching from "./ExerciseMatching";

type Props = {
  session: ExerciseSessionData;
  unitId: number;
  unitTitle: string;
  onBackToList: () => void;
};

export default function ExerciseScoreSummary({
  session,
  unitTitle,
  onBackToList,
}: Props) {
  const { locale, t } = useTranslation();
  const [showCelebration, setShowCelebration] = useState(true);

  const pct = Math.round(
    (session.score / Math.max(session.max_score, 1)) * 100
  );
  const passed = pct >= 60;

  const resultByExercise = Object.fromEntries(
    session.per_question_results.map((r) => [r.exercise_id, r])
  );

  const scoreDetail = t("FINGER_SPELLING.EXERCISE.SCORE_CORRECT")
    .replace("{{score}}", String(session.score))
    .replace("{{max}}", String(session.max_score));

  return (
    <>
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
              ? t("FINGER_SPELLING.EXERCISE.COMPLETE_TITLE")
              : t("FINGER_SPELLING.EXERCISE.KEEP_PRACTICING")
          }
          subtitle={`${unitTitle} · ${scoreDetail}`}
          actionLabel={t("FINGER_SPELLING.EXERCISE.REVIEW_ANSWERS")}
          onAction={() => setShowCelebration(false)}
          avgScore={pct}
          scoreLabel={t("FINGER_SPELLING.EXERCISE.YOUR_SCORE")}
        />
      </Dialog>

      <Stack spacing={0}>
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: "center", mb: 3 }}
        >
          <Tooltip title={t("FINGER_SPELLING.EXERCISE.BACK_TO_EXERCISE_LIST")} arrow>
            <IconButton
              onClick={onBackToList}
              aria-label={t("FINGER_SPELLING.EXERCISE.BACK_TO_EXERCISE_LIST")}
              sx={{
                width: 44,
                height: 44,
                bgcolor: KslColors.primaryLighter,
                color: KslColors.primaryDark,
                border: `1.5px solid ${KslColors.border}`,
                "&:hover": {
                  bgcolor: KslColors.primaryLight,
                  color: KslColors.primaryDark,
                },
              }}
            >
              <Icon icon="solar:arrow-left-linear" width={22} />
            </IconButton>
          </Tooltip>

          <Stack spacing={0.15} sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: fontFamilies.english,
                fontWeight: 800,
                fontSize: { xs: KslFontSizes.lg, md: KslFontSizes.xl },
                color: KslColors.textPrimary,
                letterSpacing: "-0.03em",
              }}
            >
              {t("FINGER_SPELLING.EXERCISE.ANSWER_REVIEW")}
            </Typography>
            <Typography
              sx={{
                fontSize: KslFontSizes.sm,
                color: KslColors.textSecondary,
                fontWeight: 600,
              }}
            >
              {unitTitle} · {pct}% · {scoreDetail}
            </Typography>
          </Stack>

          <Tooltip title={t("FINGER_SPELLING.EXERCISE.SEE_RESULT")} arrow>
            <IconButton
              onClick={() => setShowCelebration(true)}
              aria-label={t("FINGER_SPELLING.EXERCISE.SEE_RESULT")}
              sx={{
                width: 44,
                height: 44,
                bgcolor: passed
                  ? KslColors.primaryLight
                  : "rgba(243,184,63,0.2)",
                color: passed ? KslColors.primary : KslColors.inProgress,
                border: `1.5px solid ${
                  passed ? KslColors.primary : KslColors.inProgress
                }`,
              }}
            >
              <Icon icon="mdi:trophy-variant" width={22} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack
          spacing={0}
          divider={<Divider sx={{ borderStyle: "dashed", my: 4 }} />}
        >
          {session.questions.map((q, index) => {
            const result = resultByExercise[q.exercise_id];
            return (
              <Stack key={q.exercise_id} spacing={2}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: "flex-start" }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: result?.is_correct
                        ? KslColors.primaryLight
                        : "#fff0ef",
                      color: result?.is_correct
                        ? KslColors.primary
                        : KslColors.error,
                      flexShrink: 0,
                      lineHeight: 0,
                    }}
                  >
                    <Icon
                      icon={
                        result?.is_correct
                          ? "mdi:check-bold"
                          : "mdi:close-thick"
                      }
                      width={14}
                      height={14}
                    />
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
                      }}
                    >
                      Q{index + 1} · {q.exercise_type.replace("_", " ")}
                    </Typography>
                  </Stack>
                </Stack>

                {q.exercise_type === "multiple_choice" && (
                  <ExerciseMultipleChoice
                    question={q}
                    selected={null}
                    onSelect={() => {}}
                    reviewResult={result}
                  />
                )}
                {q.exercise_type === "true_false" && (
                  <ExerciseTrueFalse
                    question={q}
                    selected={null}
                    onSelect={() => {}}
                    reviewResult={result}
                  />
                )}
                {q.exercise_type === "multiple_answer" && (
                  <ExerciseMultipleAnswer
                    question={q}
                    selected={[]}
                    onToggle={() => {}}
                    reviewResult={result}
                  />
                )}
                {q.exercise_type === "matching" && (
                  <ExerciseMatching
                    question={q}
                    pairs={result?.matching_pairs ?? {}}
                    onSetPairs={() => {}}
                    reviewResult={result}
                  />
                )}
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </>
  );
}
