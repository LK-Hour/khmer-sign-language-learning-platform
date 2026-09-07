"use client";

import { useState } from "react";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Iconify from "@/components/iconify";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";

import { SAMPLE_SENTENCES } from "../data/sampleSentences";

export default function SentenceSampleList() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(SAMPLE_SENTENCES[0]?.id ?? "");
  const selected = SAMPLE_SENTENCES.find((sentence) => sentence.id === selectedId);

  const handleStart = () => {
    if (!selected) return;
    router.push(
      `/${locale}${ROUTES.sentenceSpelling.practice({ text: selected.textKh, source: "sample" })}`
    );
  };

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }} sx={{ width: "100%" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
        }}
      >
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
            {t("SENTENCE_SPELLING.SAMPLE.EYEBROW")}
          </Typography>
          <Typography
            component="h1"
            sx={{
              color: KslColors.textPrimary,
              fontFamily: fontFamilies.sans,
              fontSize: { xs: 26, md: 36 },
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            {t("SENTENCE_SPELLING.SAMPLE.TITLE")}
          </Typography>
          <Typography
            sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.sm, lineHeight: 1.45 }}
          >
            {t("SENTENCE_SPELLING.SAMPLE.DESCRIPTION")}
          </Typography>
        </Stack>

        <Button
          component={Link}
          href={`/${locale}${ROUTES.sentenceSpelling.root}`}
          variant="outlined"
          sx={{
            borderColor: KslColors.border,
            borderRadius: `${KslRadii.button}px`,
            color: KslColors.primaryDark,
            fontWeight: 700,
            px: 2.5,
            py: 1.25,
            flexShrink: 0,
          }}
        >
          {t("SENTENCE_SPELLING.BACK")}
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${KslColors.border}`,
          borderRadius: `${KslRadii.card}px`,
          p: { xs: 2.25, md: 3 },
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={1}>
            {SAMPLE_SENTENCES.map((sentence) => {
              const isSelected = sentence.id === selectedId;
              return (
                <Box
                  key={sentence.id}
                  component="button"
                  type="button"
                  onClick={() => setSelectedId(sentence.id)}
                  aria-pressed={isSelected}
                  sx={{
                    alignItems: "center",
                    bgcolor: isSelected ? KslColors.primaryLighter : "background.paper",
                    border: `1px solid ${isSelected ? KslColors.primary : KslColors.border}`,
                    borderRadius: `${KslRadii.wordCard}px`,
                    cursor: "pointer",
                    display: "flex",
                    gap: 1.5,
                    justifyContent: "space-between",
                    px: 1.5,
                    py: 1.25,
                    textAlign: "left",
                    transition: "border-color 0.15s ease, background-color 0.15s ease",
                    "&:hover": {
                      borderColor: KslColors.primary,
                      bgcolor: KslColors.primaryLighter,
                    },
                  }}
                >
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: KslColors.textPrimary,
                        fontFamily: fontFamilies.sans,
                        fontSize: KslFontSizes.lg,
                        fontWeight: 500,
                        lineHeight: 1.5,
                      }}
                    >
                      {sentence.textKh}
                    </Typography>
                    <Typography
                      sx={{
                        color: KslColors.textSecondary,
                        fontSize: KslFontSizes.xs,
                        lineHeight: 1.4,
                      }}
                    >
                      {sentence.textEn}
                    </Typography>
                  </Stack>

                  {isSelected && (
                    <Iconify
                      icon="solar:check-circle-bold"
                      sx={{ width: 22, height: 22, color: KslColors.primary, flexShrink: 0 }}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>

          <Button
            variant="contained"
            disabled={!selected}
            onClick={handleStart}
            startIcon={<Iconify icon="solar:play-bold" sx={{ width: 18, height: 18 }} />}
            sx={{
              alignSelf: "flex-start",
              borderRadius: `${KslRadii.button}px`,
              boxShadow: KslShadows.button,
              fontWeight: 700,
              px: 2.5,
              py: 1,
            }}
          >
            {t("SENTENCE_SPELLING.SAMPLE.CTA")}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
