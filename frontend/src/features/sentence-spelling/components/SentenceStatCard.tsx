"use client";

import type { ReactNode } from "react";

import { Box, Paper, Stack, Typography } from "@mui/material";

import Iconify from "@/components/iconify";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

type SentenceStatCardProps = {
  label: string;
  value: string;
  /** Dimmed text next to the value, e.g. the "/ 18" in "18 / 18". */
  valueSuffix?: string;
  valueColor?: string;
  caption?: ReactNode;
  /** Right-hand visual-usually a `SentenceStatIconTile` or a progress ring. */
  icon: ReactNode;
};

export function SentenceStatIconTile({ icon }: { icon: string }) {
  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: KslColors.primaryLight,
        borderRadius: `${KslRadii.card}px`,
        color: KslColors.primaryDark,
        display: "flex",
        flexShrink: 0,
        height: 56,
        justifyContent: "center",
        width: 56,
      }}
    >
      <Iconify icon={icon} sx={{ width: 28, height: 28 }} />
    </Box>
  );
}

export default function SentenceStatCard({
  label,
  value,
  valueSuffix,
  valueColor = KslColors.textPrimary,
  caption,
  icon,
}: SentenceStatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        alignItems: "flex-start",
        bgcolor: KslColors.primaryLighter,
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        display: "flex",
        gap: 2,
        height: "100%",
        justifyContent: "space-between",
        p: { xs: 2, md: 2.5 },
        textAlign: "left",
      }}
    >
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: KslColors.textSecondary,
            fontSize: KslFontSizes.sm,
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          {label}
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "baseline", flexWrap: "wrap" }}>
          <Typography
            sx={{
              color: valueColor,
              fontFamily: fontFamilies.english,
              fontSize: { xs: KslFontSizes["2xl"], md: KslFontSizes["3xl"] },
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>
          {valueSuffix ? (
            <Typography
              sx={{
                color: KslColors.textSecondary,
                fontFamily: fontFamilies.english,
                fontSize: KslFontSizes.md,
                fontWeight: 600,
              }}
            >
              {valueSuffix}
            </Typography>
          ) : null}
        </Stack>
        {caption}
      </Stack>
      {icon}
    </Paper>
  );
}
