"use client";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { kslColors, kslFontSizes, kslRadii, kslShadows } from "@/theme/theme";
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      {question.promptText && (
        <Typography
          variant="h5"
          sx={{
            fontSize: kslFontSizes.lg,
            fontWeight: 700,
            color: kslColors.secondary,
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
            borderRadius: `${kslRadii.signImage}px`,
            overflow: "hidden",
            boxShadow: kslShadows.drop,
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
        inputProps={{ "aria-label": "Answer input" }}
        sx={{
          maxWidth: 886,
          "& .MuiOutlinedInput-root": {
            minHeight: 84,
            borderRadius: 2,
            fontSize: kslFontSizes.md,
          },
        }}
      />
    </Box>
  );
}
