"use client";

import { Box, Grid, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";
import type { ExerciseQuestionData, ExerciseAnswerResultData } from "../../types/exercise";
import ExerciseSignMedia from "./ExerciseSignMedia";

type Props = {
  question: ExerciseQuestionData;
  selected: number | null;
  onSelect: (optionId: number) => void;
  reviewResult?: ExerciseAnswerResultData | null;
};

export default function ExerciseMultipleChoice({ question, selected, onSelect, reviewResult }: Props) {
  const isReview = reviewResult != null;

  function optionState(optId: number): "selected" | "correct" | "incorrect" | "neutral" {
    if (!isReview) return selected === optId ? "selected" : "neutral";
    const isCorrect = reviewResult!.correct_option_ids.includes(optId);
    const wasSelected = reviewResult!.selected_option_ids.includes(optId);
    if (isCorrect) return "correct";
    if (wasSelected && !isCorrect) return "incorrect";
    return "neutral";
  }

  const optionStyles: Record<string, { bg: string; border: string; color: string }> = {
    selected: { bg: "#e7f2ff", border: "#137FEC", color: KslColors.secondary },
    correct: { bg: "#dff7ed", border: "#1f9f6f", color: KslColors.primary },
    incorrect: { bg: "#fff0ef", border: "#FF4438", color: KslColors.error },
    neutral: { bg: "#fff", border: KslColors.border, color: KslColors.textPrimary },
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      {question.media_url && (
        <ExerciseSignMedia url={question.media_url} alt="Sign prompt" size={220} />
      )}
      <Grid container spacing={1.5} sx={{ width: "100%", maxWidth: 600 }}>
        {question.options.map((opt) => {
          const state = optionState(opt.id);
          const style = optionStyles[state];
          return (
            <Grid key={opt.id} size={{ xs: 6 }}>
              <Box
                component={motion.button}
                whileTap={!isReview ? { scale: 0.97 } : {}}
                onClick={() => !isReview && onSelect(opt.id)}
                sx={{
                  width: "100%",
                  py: 1.5,
                  px: 2,
                  borderRadius: `${KslRadii.card}px`,
                  border: `2px solid ${style.border}`,
                  bgcolor: style.bg,
                  color: style.color,
                  cursor: isReview ? "default" : "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: fontFamilies.kh,
                    fontSize: KslFontSizes.xl,
                    fontWeight: 700,
                    lineHeight: 1.4,
                  }}
                >
                  {opt.option_text_kh}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
