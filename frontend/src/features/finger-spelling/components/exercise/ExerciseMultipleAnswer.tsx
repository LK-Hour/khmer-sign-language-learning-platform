"use client";

import { Box, Grid } from "@mui/material";
import { motion } from "framer-motion";
import { KslColors, KslRadii } from "@/theme/theme";
import type { ExerciseQuestionData, ExerciseAnswerResultData } from "../../types/exercise";
import ExerciseSignMedia from "./ExerciseSignMedia";

type Props = {
  question: ExerciseQuestionData;
  selected: number[];
  onToggle: (optionId: number) => void;
  reviewResult?: ExerciseAnswerResultData | null;
};

export default function ExerciseMultipleAnswer({ question, selected, onToggle, reviewResult }: Props) {
  const isReview = reviewResult != null;

  function optionState(optId: number): "selected" | "correct" | "incorrect" | "neutral" {
    if (!isReview) return selected.includes(optId) ? "selected" : "neutral";
    const isCorrect = reviewResult!.correct_option_ids.includes(optId);
    const wasSelected = reviewResult!.selected_option_ids.includes(optId);
    if (isCorrect && wasSelected) return "correct";
    if (isCorrect && !wasSelected) return "correct"; // missed correct — still show green
    if (!isCorrect && wasSelected) return "incorrect";
    return "neutral";
  }

  const styleMap = {
    selected: { border: "#137FEC", overlay: "rgba(19,127,236,0.12)" },
    correct: { border: "#1f9f6f", overlay: "rgba(31,159,111,0.14)" },
    incorrect: { border: "#FF4438", overlay: "rgba(255,68,56,0.12)" },
    neutral: { border: KslColors.border, overlay: "transparent" },
  };

  const optionCount = question.options.length;
  const gridSize =
    optionCount === 6
      ? { xs: 4 as const, sm: 4 as const, md: 4 as const }
      : { xs: 6 as const, sm: 6 as const, md: 3 as const };

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={1.5}>
        {question.options.map((opt) => {
          const state = optionState(opt.id);
          const style = styleMap[state];
          return (
            <Grid key={opt.id} size={gridSize}>
              <Box
                component={motion.button}
                whileTap={!isReview ? { scale: 0.95 } : {}}
                onClick={() => !isReview && onToggle(opt.id)}
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  borderRadius: `${KslRadii.card}px`,
                  border: `2px solid ${style.border}`,
                  bgcolor: style.overlay,
                  cursor: isReview ? "default" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                <ExerciseSignMedia
                  url={opt.media_url}
                  alt={opt.option_text_kh ?? "Sign"}
                  size={100}
                  reviewState={
                    state === "correct" ? "correct" : state === "incorrect" ? "incorrect" : "neutral"
                  }
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
