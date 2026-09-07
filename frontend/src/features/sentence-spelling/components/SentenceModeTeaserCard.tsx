"use client";

import { Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

import Iconify from "@/components/iconify";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

type SentenceModeTeaserCardProps = {
  href: string;
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
};

export default function SentenceModeTeaserCard({
  href,
  icon,
  eyebrow,
  title,
  description,
  ctaLabel,
}: SentenceModeTeaserCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        p: { xs: 2.25, md: 3 },
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack
          sx={{
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: KslColors.primaryLighter,
            color: KslColors.primaryDark,
          }}
        >
          <Iconify icon={icon} sx={{ width: 24, height: 24 }} />
        </Stack>

        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Typography
            sx={{
              color: KslColors.primaryDark,
              fontSize: KslFontSizes.xs,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Typography>
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
          <Typography
            sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.sm, lineHeight: 1.45 }}
          >
            {description}
          </Typography>
        </Stack>

        <Button
          component={Link}
          href={href}
          variant="outlined"
          endIcon={<Iconify icon="solar:arrow-right-linear" sx={{ width: 18, height: 18 }} />}
          sx={{
            alignSelf: "flex-start",
            borderColor: KslColors.primary,
            borderRadius: `${KslRadii.button}px`,
            color: KslColors.primary,
            fontWeight: 700,
            px: 2.5,
            py: 1,
            "&:hover": { bgcolor: KslColors.primaryLight },
          }}
        >
          {ctaLabel}
        </Button>
      </Stack>
    </Paper>
  );
}
