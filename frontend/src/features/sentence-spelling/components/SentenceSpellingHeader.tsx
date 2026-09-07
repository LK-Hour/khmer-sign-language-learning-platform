"use client";

import { Stack, Typography } from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes } from "@/theme/theme";

export default function SentenceSpellingHeader() {
  const { t } = useTranslation();

  return (
    <Stack spacing={1.5}>
      <Typography
        sx={{
          color: KslColors.primaryDark,
          fontFamily: fontFamilies.sans,
          fontSize: KslFontSizes.md,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {t("SENTENCE_SPELLING.TRACK.EYEBROW")}
      </Typography>
      <Typography
        component="h1"
        sx={{
          color: KslColors.textPrimary,
          fontFamily: fontFamilies.sans,
          fontSize: { xs: 30, md: 42 },
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
        }}
      >
        {t("SENTENCE_SPELLING.TRACK.TITLE")}
      </Typography>
    </Stack>
  );
}
