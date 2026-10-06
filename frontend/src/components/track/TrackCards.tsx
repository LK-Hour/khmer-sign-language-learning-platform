"use client";

import { Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

/** Square step-number badge used on track unit cards and summary cards. */
export function NumberBadge({ children }: { children: ReactNode }) {
  return (
    <Stack
      component="span"
      sx={{
        alignItems: "center",
        bgcolor: KslColors.primaryLighter,
        borderRadius: 2.5,
        color: KslColors.primaryDark,
        flexShrink: 0,
        fontFamily: fontFamilies.english,
        fontSize: KslFontSizes.lg,
        fontWeight: 700,
        height: 42,
        justifyContent: "center",
        width: 42,
      }}
    >
      {children}
    </Stack>
  );
}

export type TrackSummaryCardProps = {
  step: string;
  title: string;
  description: string;
  completedCount: number;
  totalCount: number;
  countLabel: string;
  active?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
};

/** Progress summary card shown above a learning track's units. */
export function TrackSummaryCard({
  step,
  title,
  description,
  completedCount,
  totalCount,
  countLabel,
  active = false,
  ctaHref,
  ctaLabel,
}: TrackSummaryCardProps) {
  const { t, locale } = useTranslation();

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        border: `1px solid ${active ? "rgba(31,159,111,0.35)" : KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        boxShadow: active ? "0 0 0 1px rgba(31,159,111,0.08)" : "none",
        p: { xs: 2.25, md: 3 },
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
        >
          <NumberBadge>{step}</NumberBadge>
          <Typography
            sx={{
              color: KslColors.textSecondary,
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
              lineHeight: 1.35,
              textAlign: "right",
            }}
          >
            {locale === "kh"
              ? `${t("PHRASES.COMPLETED")} ${completedCount}/${totalCount} ${countLabel}`
              : `${completedCount} ${t("PHRASES.OF")} ${totalCount} ${countLabel} ${t("PHRASES.COMPLETED")}`}
          </Typography>
        </Stack>

        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Typography
            sx={{
              color: KslColors.textPrimary,
              fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            {title}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "stretch", sm: "flex-end" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              sx={{
                color: KslColors.textSecondary,
                fontSize: KslFontSizes.sm,
                lineHeight: 1.45,
                flex: 1,
                minWidth: 0,
              }}
            >
              {description}
            </Typography>
            {ctaHref && ctaLabel && (
              <Button
                component={Link}
                href={ctaHref}
                variant="outlined"
                size="small"
                sx={{
                  flexShrink: 0,
                  alignSelf: { xs: "flex-end", sm: "auto" },
                  borderColor: KslColors.primary,
                  color: KslColors.primary,
                  fontWeight: 700,
                  borderRadius: "8px",
                  "&:hover": { bgcolor: KslColors.primaryLight },
                }}
              >
                {ctaLabel}
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
