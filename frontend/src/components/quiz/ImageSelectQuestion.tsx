"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { kslColors, kslFontSizes, kslRadii, kslShadows } from "@/theme/theme";
import type { QuizQuestion } from "./types";

type ImageSelectQuestionProps = {
  question: QuizQuestion;
  selectedIds: string[];
  onToggle: (optionId: string) => void;
};

export default function ImageSelectQuestion({
  question,
  selectedIds,
  onToggle,
}: ImageSelectQuestionProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
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
            maxWidth: 518,
          }}
        >
          {question.promptText}
        </Typography>
      )}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          justifyContent: "center",
        }}
      >
        {question.options.map((opt, index) => {
          const selected = selectedIds.includes(opt.id);
          return (
            <Box
              key={opt.id}
              component="button"
              type="button"
              onClick={() => onToggle(opt.id)}
              aria-pressed={selected}
              sx={{
                position: "relative",
                width: 390,
                maxWidth: "100%",
                border: selected
                  ? `3px solid ${kslColors.primary}`
                  : "3px solid transparent",
                borderRadius: `${kslRadii.signImage}px`,
                p: 0,
                cursor: "pointer",
                bgcolor: "transparent",
                boxShadow: kslShadows.drop,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: 390,
                  borderRadius: `${kslRadii.signImage}px`,
                  overflow: "hidden",
                }}
              >
                {opt.imageUrl && (
                  <Image
                    src={opt.imageUrl}
                    alt={`Sign option ${opt.letter}`}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                )}
              </Box>
              <Box
                sx={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  width: 29,
                  height: 29,
                  borderRadius: 1,
                  bgcolor: selected ? kslColors.primary : "grey.400",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: kslFontSizes.sm,
                }}
              >
                {index + 1}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
