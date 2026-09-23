"use client";

import { Stack, Typography } from "@mui/material";

import Iconify from "@/components/iconify";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes } from "@/theme/theme";

import { skipLabelKey } from "../utils/practiceStats";
import SentenceStatCard, { SentenceStatIconTile } from "./SentenceStatCard";

type SentenceSignsCompletedCardProps = {
  completedCount: number;
  skippedCount: number;
  totalCount: number;
};

export default function SentenceSignsCompletedCard({
  completedCount,
  skippedCount,
  totalCount,
}: SentenceSignsCompletedCardProps) {
  const { t } = useTranslation();
  const skipText = t(skipLabelKey(skippedCount)).replace("{{count}}", String(skippedCount));
  const captionColor = skippedCount === 0 ? KslColors.success : KslColors.fail;

  return (
    <SentenceStatCard
      label={t("SENTENCE_SPELLING.PRACTICE.STATS.SIGNS_LABEL")}
      value={String(completedCount)}
      valueSuffix={`/ ${totalCount}`}
      caption={
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: captionColor }}>
          <Iconify
            icon={skippedCount === 0 ? "solar:check-circle-bold" : "solar:danger-circle-bold"}
            sx={{ width: 16, height: 16 }}
          />
          <Typography sx={{ color: "inherit", fontSize: KslFontSizes.sm, fontWeight: 600 }}>
            {skipText}
          </Typography>
        </Stack>
      }
      icon={<SentenceStatIconTile icon="solar:hand-stars-bold" />}
    />
  );
}
