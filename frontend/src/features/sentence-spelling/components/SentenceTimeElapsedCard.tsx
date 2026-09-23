"use client";

import { Typography } from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes } from "@/theme/theme";

import { secondsPerSign, splitElapsed } from "../utils/practiceStats";
import SentenceStatCard, { SentenceStatIconTile } from "./SentenceStatCard";

type SentenceTimeElapsedCardProps = {
  /** `null` when the clock never started (e.g. the camera never became ready). */
  elapsedMs: number | null;
  totalCount: number;
};

export default function SentenceTimeElapsedCard({
  elapsedMs,
  totalCount,
}: SentenceTimeElapsedCardProps) {
  const { t } = useTranslation();

  let value = "—";
  let pacing: string | null = null;

  if (elapsedMs !== null) {
    const { hours, minutes, seconds } = splitElapsed(elapsedMs);
    const template =
      hours > 0
        ? t("SENTENCE_SPELLING.PRACTICE.STATS.TIME_HOURS_MINUTES")
        : minutes > 0
          ? t("SENTENCE_SPELLING.PRACTICE.STATS.TIME_MINUTES_SECONDS")
          : t("SENTENCE_SPELLING.PRACTICE.STATS.TIME_SECONDS");
    value = template
      .replace("{{h}}", String(hours))
      .replace("{{m}}", String(minutes))
      .replace("{{s}}", String(seconds));
    pacing = t("SENTENCE_SPELLING.PRACTICE.STATS.PACING").replace(
      "{{seconds}}",
      secondsPerSign(elapsedMs, totalCount).toFixed(1)
    );
  }

  return (
    <SentenceStatCard
      label={t("SENTENCE_SPELLING.PRACTICE.STATS.TIME_LABEL")}
      value={value}
      caption={
        pacing ? (
          <Typography sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.sm }}>
            {pacing}
          </Typography>
        ) : null
      }
      icon={<SentenceStatIconTile icon="solar:stopwatch-bold" />}
    />
  );
}
