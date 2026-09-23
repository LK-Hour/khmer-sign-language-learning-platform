"use client";

import { Box, CircularProgress, Typography } from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes } from "@/theme/theme";

import SentenceStatCard from "./SentenceStatCard";

const RING_SIZE = 56;
const RING_THICKNESS = 5;

type SentenceAccuracyCardProps = {
  /** Average confidence across the sentence, 0–100. */
  accuracyPercent: number;
};

export default function SentenceAccuracyCard({ accuracyPercent }: SentenceAccuracyCardProps) {
  const { t } = useTranslation();
  const rounded = Math.round(Math.min(100, Math.max(0, accuracyPercent)));

  return (
    <SentenceStatCard
      label={t("SENTENCE_SPELLING.PRACTICE.STATS.ACCURACY_LABEL")}
      value={`${rounded}%`}
      valueColor={KslColors.primaryDark}
      caption={
        <Typography sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.sm }}>
          {t("SENTENCE_SPELLING.PRACTICE.STATS.ACCURACY_CAPTION")}
        </Typography>
      }
      icon={
        <Box sx={{ flexShrink: 0, height: RING_SIZE, position: "relative", width: RING_SIZE }}>
          <CircularProgress
            aria-hidden
            variant="determinate"
            value={100}
            size={RING_SIZE}
            thickness={RING_THICKNESS}
            sx={{ color: KslColors.primaryLight, position: "absolute", inset: 0 }}
          />
          <CircularProgress
            aria-hidden
            variant="determinate"
            value={rounded}
            size={RING_SIZE}
            thickness={RING_THICKNESS}
            sx={{ color: KslColors.primary, position: "absolute", inset: 0 }}
          />
        </Box>
      }
    />
  );
}
