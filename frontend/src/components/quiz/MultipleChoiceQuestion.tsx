"use client";

import { Box, Grid, Stack } from "@mui/material";
import Image from "next/image";
import { KslRadii, KslShadows } from "@/theme/theme";
import OptionButton from "./OptionButton";
import type { QuizQuestion } from "./types";

type MultipleChoiceQuestionProps = {
  question: QuizQuestion;
  selectedId?: string;
  onSelect: (optionId: string) => void;
};

export default function MultipleChoiceQuestion({
  question,
  selectedId,
  onSelect,
}: MultipleChoiceQuestionProps) {
  return (
    <Stack
      sx={{
        alignItems: "center",
        gap: 4,
      }}
    >
      {question.promptImageUrl && (
        <Box
          sx={{
            position: "relative",
            width: 390,
            maxWidth: "100%",
            height: 390,
            borderRadius: `${KslRadii.signImage}px`,
            overflow: "hidden",
            boxShadow: KslShadows.drop,
          }}
        >
          <Image
            src={question.promptImageUrl}
            alt={question.promptText ?? "Sign prompt"}
            fill
            style={{ objectFit: "cover" }}
          />
        </Box>
      )}
      <Grid container spacing={2} sx={{ width: "100%", maxWidth: 900 }}>
        {question.options.map((opt) => (
          <Grid key={opt.id} size={{ xs: 12, sm: 6 }}>
            <OptionButton
              letter={opt.letter}
              romanization={opt.romanization}
              selected={selectedId === opt.id}
              onClick={() => onSelect(opt.id)}
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
