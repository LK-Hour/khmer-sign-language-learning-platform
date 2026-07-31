"use client";

import { memo } from "react";
import { Box, Stack } from "@mui/material";
import { Icon } from "@iconify/react";
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

function ExerciseTrueFalse({
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
        <ExerciseSignMedia url={question.media_url} alt="Sign" size={240} />
      )}
      <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "center" }}>
        {question.options.map((opt) => {
          const state = optionState(opt.id);
          const isTrue = opt.option_text_en === "True";
          return (
            <ExerciseOptionCard
              key={opt.id}
              state={state}
              interactive={!isReview}
              onClick={() => onSelect(opt.id)}
              ariaLabel={isTrue ? "True" : "False"}
              sx={{
                flex: 1,
                maxWidth: 180,
                py: 2.5,
              }}
            >
              <Icon
                icon={isTrue ? "solar:check-circle-bold" : "solar:close-circle-bold"}
                width={36}
              />
            </ExerciseOptionCard>
          );
        })}
      </Stack>
    </Box>
  );
}

export default memo(ExerciseTrueFalse);
