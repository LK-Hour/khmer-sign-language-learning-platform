"use client";

import Box from "@mui/material/Box";
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
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
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          width: "100%",
          maxWidth: 900,
        }}
      >
        {question.options.map((opt) => (
          <OptionButton
            key={opt.id}
            letter={opt.letter}
            romanization={opt.romanization}
            selected={selectedId === opt.id}
            onClick={() => onSelect(opt.id)}
          />
        ))}
      </Box>
    </Box>
  );
}
