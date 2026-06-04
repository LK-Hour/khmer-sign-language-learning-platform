"use client";

import Box from "@mui/material/Box";
import { motion } from "framer-motion";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";
import { useTranslation } from "@/i18n/useTranslation";
import SignImageCard from "./SignImageCard";
import WordCard from "./WordCard";

type LessonIntroStepProps = {
  letter: string;
  romanization?: string | null;
  imageUrl: string;
  onContinue: () => void;
};

export default function LessonIntroStep({
  letter,
  romanization,
  imageUrl,
  onContinue,
}: LessonIntroStepProps) {
  const { t } = useTranslation();

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        maxWidth: 640,
        mx: "auto",
      }}
    >
      <SignImageCard
        src={imageUrl}
        alt={`Sign for ${letter}`}
      />
      <WordCard
        letter={letter}
        romanization={romanization ?? undefined}
        showRomanization
      />
      <PrimaryActionButton label={t("fsContinue")} onClick={onContinue} />
    </Box>
  );
}
