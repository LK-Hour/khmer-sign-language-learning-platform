"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

import Iconify from "@/components/iconify";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";

import { saveLastPractice } from "../utils/recentProgress";

type SentenceSpellingPracticeViewProps = {
  text: string;
  source: "sample" | "custom";
};

export default function SentenceSpellingPracticeView({
  text,
  source,
}: SentenceSpellingPracticeViewProps) {
  const { t, locale } = useTranslation();
  const characters = useMemo(() => Array.from(text.replace(/\s+/g, "")), [text]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const backHref =
    source === "custom" ? ROUTES.sentenceSpelling.custom : ROUTES.sentenceSpelling.sample;
  const isComplete = characters.length > 0 && currentIndex >= characters.length;
  const currentChar = !isComplete ? characters[currentIndex] : undefined;

  const handleNext = () => setCurrentIndex((index) => Math.min(index + 1, characters.length));
  const handleRestart = () => setCurrentIndex(0);

  useEffect(() => {
    if (characters.length === 0) return;
    saveLastPractice({ text, source });
  }, [text, source, characters.length]);

  if (characters.length === 0) {
    return (
      <Stack spacing={2}>
        <Typography sx={{ color: KslColors.textSecondary }}>
          {t("SENTENCE_SPELLING.PRACTICE.EMPTY")}
        </Typography>
        <Button
          component={Link}
          href={`/${locale}${backHref}`}
          variant="outlined"
          sx={{
            alignSelf: "flex-start",
            borderColor: KslColors.border,
            borderRadius: `${KslRadii.button}px`,
            color: KslColors.primaryDark,
            fontWeight: 700,
          }}
        >
          {t("SENTENCE_SPELLING.BACK")}
        </Button>
      </Stack>
    );
  }

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
        <Stack spacing={1}>
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
            {t("SENTENCE_SPELLING.PRACTICE.EYEBROW")}
          </Typography>
          <Typography
            component="h1"
            sx={{
              color: KslColors.textPrimary,
              fontFamily: fontFamilies.khmer,
              fontSize: { xs: 22, md: 30 },
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {text}
          </Typography>
        </Stack>

        <Button
          component={Link}
          href={`/${locale}${backHref}`}
          startIcon={<Iconify icon="akar-icons:arrow-back-thick-fill" sx={{ width: 16, height: 16 }} />}
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
        <Stack spacing={3} sx={{ alignItems: "center" }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "center" }}>
            {characters?.map((char, index) => {
              const state =
                index < currentIndex ? "done" : index === currentIndex ? "now" : "upcoming";
              return (
                <Stack
                  key={`${char}-${index}`}
                  sx={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: 52,
                    height: 52,
                    borderRadius: `${KslRadii.wordCard}px`,
                    fontFamily: fontFamilies.khmer,
                    fontSize: KslFontSizes.lg,
                    fontWeight: 600,
                    border: `1px solid ${
                      state === "now" ? KslColors.primary : KslColors.border
                    }`,
                    bgcolor:
                      state === "done"
                        ? KslColors.primaryLighter
                        : state === "now"
                          ? KslColors.primaryLight
                          : "background.paper",
                    color:
                      state === "upcoming" ? KslColors.textSecondary : KslColors.textPrimary,
                  }}
                >
                  {char}
                </Stack>
              );
            })}
          </Stack>

          {!isComplete ? (
            <>
              <Stack
                sx={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: { xs: 140, md: 180 },
                  height: { xs: 140, md: 180 },
                  borderRadius: `${KslRadii.signImage}px`,
                  bgcolor: KslColors.primaryLighter,
                  border: `2px solid ${KslColors.primary}`,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: fontFamilies.khmer,
                    fontSize: { xs: 56, md: 72, lg: 80 },
                    fontWeight: 700,
                    color: KslColors.primaryDark,
                  }}
                >
                  {currentChar}
                </Typography>
              </Stack>

              <Typography
                sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.sm, fontWeight: 700 }}
              >
                {currentIndex + 1} / {characters.length}
              </Typography>

              <Button
                variant="contained"
                onClick={handleNext}
                startIcon={<Iconify icon="solar:play-bold" sx={{ width: 18, height: 18 }} />}
                sx={{
                  borderRadius: `${KslRadii.button}px`,
                  boxShadow: KslShadows.button,
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                }}
              >
                {t("SENTENCE_SPELLING.PRACTICE.NEXT")}
              </Button>
            </>
          ) : (
            <Stack spacing={2} sx={{ alignItems: "center" }}>
              <Iconify
                icon="solar:cup-star-bold"
                sx={{ width: 56, height: 56, color: KslColors.success }}
              />
              <Typography
                sx={{ color: KslColors.textPrimary, fontSize: KslFontSizes.lg, fontWeight: 700 }}
              >
                {t("SENTENCE_SPELLING.PRACTICE.COMPLETE")}
              </Typography>
              <Button
                variant="outlined"
                onClick={handleRestart}
                sx={{
                  borderColor: KslColors.primary,
                  borderRadius: `${KslRadii.button}px`,
                  color: KslColors.primary,
                  fontWeight: 700,
                }}
              >
                {t("SENTENCE_SPELLING.PRACTICE.RESTART")}
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
