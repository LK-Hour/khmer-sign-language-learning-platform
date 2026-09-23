"use client";

import { Grid } from "@mui/material";

import SentenceAccuracyCard from "./SentenceAccuracyCard";
import SentenceSignsCompletedCard from "./SentenceSignsCompletedCard";
import SentenceTimeElapsedCard from "./SentenceTimeElapsedCard";

type SentenceCompletionSummaryProps = {
  accuracyPercent: number;
  completedCount: number;
  skippedCount: number;
  totalCount: number;
  /** `null` when the practice clock never started. */
  elapsedMs: number | null;
};

export default function SentenceCompletionSummary({
  accuracyPercent,
  completedCount,
  skippedCount,
  totalCount,
  elapsedMs,
}: SentenceCompletionSummaryProps) {
  return (
    <Grid container spacing={2} sx={{ width: "100%" }}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SentenceAccuracyCard accuracyPercent={accuracyPercent} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SentenceSignsCompletedCard
          completedCount={completedCount}
          skippedCount={skippedCount}
          totalCount={totalCount}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SentenceTimeElapsedCard elapsedMs={elapsedMs} totalCount={totalCount} />
      </Grid>
    </Grid>
  );
}
