"use client";

import { memo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";
import { useTranslation } from "@/i18n/useTranslation";
import type { ExerciseQuestionData, ExerciseAnswerResultData } from "../../types/exercise";
import { exerciseOptionStyleMap } from "./ExerciseOptionCard";
import ExerciseSignMedia from "./ExerciseSignMedia";

type Props = {
  question: ExerciseQuestionData;
  selected: number[];
  onToggle: (optionId: number) => void;
  reviewResult?: ExerciseAnswerResultData | null;
};

type VisualState = "selected" | "correct" | "incorrect" | "missed" | "neutral";

const missedStyle = {
  bg: KslColors.primaryLighter,
  border: KslColors.primary,
  color: KslColors.primary,
  borderStyle: "dashed" as const,
};

function ExerciseMultipleAnswer({
  question,
  selected,
  onToggle,
  reviewResult,
}: Props) {
  const { t } = useTranslation();
  const isReview = reviewResult != null;
  const requiredCount = question.required_selection_count ?? null;
  const atLimit =
    requiredCount != null && selected.length >= requiredCount;

  function optionState(optId: number): VisualState {
    if (!isReview) return selected.includes(optId) ? "selected" : "neutral";
    const isCorrect = reviewResult!.correct_option_ids.includes(optId);
    const wasSelected = reviewResult!.selected_option_ids.includes(optId);
    if (isCorrect && wasSelected) return "correct";
    if (wasSelected && !isCorrect) return "incorrect";
    if (isCorrect && !wasSelected) return "missed";
    return "neutral";
  }

  function wasPicked(optId: number) {
    return isReview
      ? reviewResult!.selected_option_ids.includes(optId)
      : selected.includes(optId);
  }

  const gridSize =
    question.options.length <= 4
      ? { xs: 6 as const, sm: 3 as const }
      : { xs: 6 as const, sm: 4 as const };

  return (
    <Box sx={{ width: "100%" }}>
      {!isReview && requiredCount != null && requiredCount > 0 && (
        <Typography
          sx={{
            mb: 1.5,
            fontSize: KslFontSizes.sm,
            fontWeight: 600,
            color: KslColors.textSecondary,
          }}
        >
          {t("FINGER_SPELLING.EXERCISE.SELECT_N").replace(
            "{{count}}",
            String(requiredCount)
          )}
          {` · ${selected.length}/${requiredCount}`}
        </Typography>
      )}
      <Grid container spacing={1.5}>
        {question.options.map((opt) => {
          const state = optionState(opt.id);
          const style =
            state === "missed"
              ? missedStyle
              : exerciseOptionStyleMap[state];
          const isSelected = wasPicked(opt.id);
          const blocked = !isReview && atLimit && !selected.includes(opt.id);
          const borderStyle =
            state === "missed" ? "dashed" : "solid";

          return (
            <Grid key={opt.id} size={gridSize}>
              <Box
                component="button"
                type="button"
                onClick={() => {
                  if (isReview || blocked) return;
                  onToggle(opt.id);
                }}
                sx={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  borderRadius: `${KslRadii.card}px`,
                  border: `2px ${borderStyle} ${style.border}`,
                  bgcolor: style.bg,
                  cursor: isReview || blocked ? "default" : "pointer",
                  opacity: blocked ? 0.55 : state === "missed" ? 0.85 : 1,
                  boxShadow: isSelected && !isReview ? KslShadows.card : "none",
                  transition:
                    "border-color 0.12s ease, background-color 0.12s ease, box-shadow 0.12s ease, transform 0.08s ease, opacity 0.12s ease",
                  outline: "none",
                  WebkitTapHighlightColor: "transparent",
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                  },
                  ...(!isReview &&
                    !blocked && {
                      "@media (hover: hover) and (pointer: fine)": {
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: KslShadows.card,
                          borderColor:
                            state === "neutral"
                              ? KslColors.secondary
                              : style.border,
                          bgcolor:
                            state === "neutral"
                              ? KslColors.secondaryLighter
                              : style.bg,
                        },
                      },
                      "&:active": {
                        transform: "scale(0.97)",
                      },
                    }),
                }}
              >
                <ExerciseSignMedia
                  url={opt.media_url}
                  alt={opt.option_text_kh ?? "Sign"}
                  size={140}
                  reviewState={
                    state === "correct"
                      ? "correct"
                      : state === "incorrect"
                        ? "incorrect"
                        : "neutral"
                  }
                />

                {isReview && (opt.option_text_kh || opt.option_text_en) ? (
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.khmer,
                      fontSize: KslFontSizes.md,
                      fontWeight: 700,
                      color: style.color,
                      lineHeight: 1.2,
                      textAlign: "center",
                    }}
                  >
                    {opt.option_text_kh || opt.option_text_en}
                  </Typography>
                ) : null}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default memo(ExerciseMultipleAnswer);
