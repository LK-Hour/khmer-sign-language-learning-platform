"use client";

import { Box, Stack, TextField, Typography } from "@mui/material";
import Image from "next/image";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import type { QuizQuestion } from "./types";

type FreeInputQuestionProps = {
  question: QuizQuestion;
  value: string;
  onChange: (value: string) => void;
};

export default function FreeInputQuestion({
  question,
  value,
  onChange,
}: FreeInputQuestionProps) {
  return (
    <Stack
      sx={{
        alignItems: "center",
        gap: 4,
      }}
    >
      {question.promptText && (
        <Typography
          variant="h5"
          sx={{
            fontSize: KslFontSizes.lg,
            fontWeight: 700,
            color: KslColors.secondary,
            textAlign: "center",
          }}
        >
          {question.promptText}
        </Typography>
      )}
      {question.promptImageUrl && (
        <Box
          sx={{
            position: "relative",
            width: 360,
            maxWidth: "100%",
            height: 360,
            borderRadius: `${KslRadii.signImage}px`,
            overflow: "hidden",
            boxShadow: KslShadows.drop,
          }}
        >
          <Image
            src={question.promptImageUrl}
            alt=""
            fill
            style={{ objectFit: "cover" }}
          />
        </Box>
      )}
      <TextField
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type the letter or romanization"
        slotProps={{
          htmlInput: { "aria-label": "Answer input" },
        }}
        sx={{
          maxWidth: 886,
          "& .MuiOutlinedInput-root": {
            minHeight: 84,
            borderRadius: 2,
            fontSize: KslFontSizes.md,
          },
        }}
      />
    </Stack>
  );
}
