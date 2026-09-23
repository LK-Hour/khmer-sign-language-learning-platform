"use client";

import { useMemo } from "react";

import { Box, Paper, Stack, Typography } from "@mui/material";
import dynamic from "next/dynamic";

import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

import {
  buildAccuracyChartOptions,
  buildAccuracySeries,
  type AccuracyPoint,
} from "../utils/accuracyChart";

const CHART_HEIGHT = 280;

// ApexCharts touches `window`, so it can only load on the client-same as the admin charts.
const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <Box sx={{ height: CHART_HEIGHT }} />,
});

type SentenceAccuracyChartProps = {
  points: readonly AccuracyPoint[];
  /** The full practiced sentence, shown under the chart. */
  sentence: string;
};

export default function SentenceAccuracyChart({ points, sentence }: SentenceAccuracyChartProps) {
  const { t } = useTranslation();

  const options = useMemo(
    () =>
      buildAccuracyChartOptions({
        points,
        labels: {
          accuracy: t("SENTENCE_SPELLING.PRACTICE.CHART.SERIES"),
          skipped: t("SENTENCE_SPELLING.PRACTICE.CHART.SKIPPED"),
        },
        lineColor: KslColors.primaryDark,
        skippedColor: KslColors.fail,
      }),
    [points, t]
  );
  const series = useMemo(
    () => buildAccuracySeries(points, t("SENTENCE_SPELLING.PRACTICE.CHART.SERIES")),
    [points, t]
  );

  if (points.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        p: { xs: 2, md: 3 },
      }}
    >
      <Stack spacing={1.5}>
        <Typography
          component="h2"
          sx={{
            color: KslColors.textPrimary,
            fontSize: KslFontSizes.md,
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          {t("SENTENCE_SPELLING.PRACTICE.CHART.TITLE")}
        </Typography>

        {/* Apex sets font-family as an SVG attribute, which can't resolve the
            font CSS variables-a CSS rule can, and covers Khmer glyphs too. */}
        <Box
          sx={{
            width: "100%",
            "& .apexcharts-text, & .apexcharts-tooltip": { fontFamily: fontFamilies.sans },
          }}
        >
          <Chart options={options} series={series} type="area" height={CHART_HEIGHT} width="100%" />
        </Box>

        <Typography
          sx={{
            color: KslColors.textPrimary,
            fontFamily: fontFamilies.khmer,
            fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },
            fontWeight: 600,
            lineHeight: 1.5,
            overflowWrap: "anywhere",
            textAlign: "center",
          }}
        >
          {sentence}
        </Typography>
      </Stack>
    </Paper>
  );
}
