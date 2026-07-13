"use client";

import { Box, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";
import { useTranslation } from "@/i18n/useTranslation";
import type { ExerciseQuestionData, ExerciseAnswerResultData } from "../../types/exercise";
import ExerciseSignMedia from "./ExerciseSignMedia";

type Props = {
  question: ExerciseQuestionData;
  selected: number | null;
  onSelect: (optionId: number) => void;
  reviewResult?: ExerciseAnswerResultData | null;
};

export default function ExerciseTrueFalse({ question, selected, onSelect, reviewResult }: Props) {
  const { locale } = useTranslation();
  const isReview = reviewResult != null;

  function optionState(optId: number) {
    if (!isReview) return selected === optId ? "selected" : "neutral";
    const isCorrect = reviewResult!.correct_option_ids.includes(optId);
    const wasSelected = reviewResult!.selected_option_ids.includes(optId);
    if (isCorrect) return "correct";
    if (wasSelected && !isCorrect) return "incorrect";
    return "neutral";
  }

  const styleMap: Record<string, { bg: string; border: string; color: string }> = {
    selected: { bg: "#e7f2ff", border: "#137FEC", color: KslColors.secondary },
    correct: { bg: "#dff7ed", border: "#1f9f6f", color: KslColors.primary },
    incorrect: { bg: "#fff0ef", border: "#FF4438", color: KslColors.error },
    neutral: { bg: "#fff", border: KslColors.border, color: KslColors.textPrimary },
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      {question.media_url && (
        <ExerciseSignMedia url={question.media_url} alt="Sign" size={180} />
      )}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ width: "100%" }}>
        {question.options.map((opt) => {
          const state = optionState(opt.id);
          const style = styleMap[state];
          const isTrue = opt.option_text_en === "True";
          const label =
            locale === "kh"
              ? opt.option_text_kh || opt.option_text_en
              : opt.option_text_en || opt.option_text_kh;
          return (
            <Box
              key={opt.id}
              component={motion.button}
              whileTap={!isReview ? { scale: 0.95 } : {}}
              onClick={() => !isReview && onSelect(opt.id)}
              sx={{
                flex: 1,
                maxWidth: 180,
                py: 2,
                borderRadius: `${KslRadii.card}px`,
                border: `2px solid ${style.border}`,
                bgcolor: style.bg,
                color: style.color,
                cursor: isReview ? "default" : "pointer",
                textAlign: "center",
                transition: "all 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Typography sx={{ fontSize: 28 }}>{isTrue ? "✓" : "✗"}</Typography>
              <Typography
                sx={{
                  fontFamily: locale === "kh" ? fontFamilies.kh : fontFamilies.english,
                  fontWeight: 700,
                  fontSize: KslFontSizes.md,
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
