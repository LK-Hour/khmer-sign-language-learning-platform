"use client";

import { memo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { KslFontSizes } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";
import type { ExerciseQuestionData, ExerciseAnswerResultData } from "../../types/exercise";
import ExerciseOptionCard, {
  type ExerciseOptionVisualState,
} from "./ExerciseOptionCard";
import ExerciseSignMedia from "./ExerciseSignMedia";

type Props = {
  question: ExerciseQuestionData;
  selected: number | null;
  onSelect: (optionId: number) => void;
  reviewResult?: ExerciseAnswerResultData | null;
};

function ExerciseMultipleChoice({
  question,
  selected,
  onSelect,
  reviewResult,
}: Props) {
  const isReview = reviewResult != null;

  function optionState(optId: number): ExerciseOptionVisualState {
    if (!isReview) return selected === optId ? "selected" : "neutral";
    const isCorrect = reviewResult!.correct_option_ids.includes(optId);
    const wasSelected = reviewResult!.selected_option_ids.includes(optId);
    if (isCorrect) return "correct";
    if (wasSelected && !isCorrect) return "incorrect";
    return "neutral";
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      {question.media_url && (
        <ExerciseSignMedia url={question.media_url} alt="Sign prompt" size={280} />
      )}
      <Grid container spacing={1.5} sx={{ width: "100%", maxWidth: 600 }}>
        {question.options.map((opt) => {
          const state = optionState(opt.id);
          return (
            <Grid key={opt.id} size={{ xs: 6 }}>
              <ExerciseOptionCard
                state={state}
                interactive={!isReview}
                onClick={() => onSelect(opt.id)}
              >
                <Typography
                  sx={{
                    fontFamily: fontFamilies.khmer,
                    fontSize: KslFontSizes.xl,
                    fontWeight: 700,
                    lineHeight: 1.4,
                  }}
                >
                  {opt.option_text_kh}
                </Typography>
              </ExerciseOptionCard>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default memo(ExerciseMultipleChoice);
