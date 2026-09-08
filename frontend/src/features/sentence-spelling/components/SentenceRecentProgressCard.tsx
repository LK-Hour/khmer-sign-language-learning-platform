"use client";

import { useEffect, useState } from "react";

import { Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

import Iconify from "@/components/iconify";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";

import { getLastPractice, type LastPractice } from "../utils/recentProgress";

type SentenceRecentProgressCardProps = {
  locale: string;
};

export default function SentenceRecentProgressCard({ locale }: SentenceRecentProgressCardProps) {
  const { t } = useTranslation();
  const [lastPractice, setLastPractice] = useState<LastPractice | null>(null);

  useEffect(() => {
    setLastPractice(getLastPractice());
  }, []);

  if (!lastPractice) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        alignItems: { xs: "flex-start", sm: "center" },
        bgcolor: KslColors.primaryLighter,
        border: `1px solid ${KslColors.primaryLight}`,
        borderRadius: `${KslRadii.card}px`,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        justifyContent: "space-between",
        p: { xs: 2, md: 2.5 },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
        <Stack
          sx={{
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: "background.paper",
            color: KslColors.primary,
            flexShrink: 0,
          }}
        >
          <Iconify icon="solar:history-bold" sx={{ width: 20, height: 20 }} />
        </Stack>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: KslColors.primaryDark,
              fontSize: KslFontSizes.xs,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {t("SENTENCE_SPELLING.RECENT.EYEBROW")}
          </Typography>
          <Typography
            sx={{
              color: KslColors.textPrimary,
              fontSize: KslFontSizes.sm,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {t("SENTENCE_SPELLING.RECENT.LAST_LABEL")}{" "}
            <Typography component="span" sx={{ color: KslColors.textPrimary, fontWeight: 700 }}>
              &ldquo;{lastPractice.text}&rdquo;
            </Typography>
          </Typography>
        </Stack>
      </Stack>

      <Button
        component={Link}
        href={`/${locale}${ROUTES.sentenceSpelling.practice({
          text: lastPractice.text,
          source: lastPractice.source,
        })}`}
        variant="contained"
        endIcon={<Iconify icon="solar:play-bold" sx={{ width: 16, height: 16 }} />}
        sx={{
          borderRadius: `${KslRadii.button}px`,
          boxShadow: KslShadows.button,
          flexShrink: 0,
          fontWeight: 700,
          px: 2.5,
          py: 1,
        }}
      >
        {t("SENTENCE_SPELLING.RECENT.CONTINUE")}
      </Button>
    </Paper>
  );
}
