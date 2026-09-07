"use client";

import { useMemo, useState } from "react";

import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Iconify from "@/components/iconify";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";

import { CUSTOM_SENTENCE_HISTORY } from "../data/customSentenceHistory";

const MAX_CHARACTERS = 60;

function formatHistoryDate(isoDate: string, locale: "kh" | "en"): string {
  return new Intl.DateTimeFormat(locale === "kh" ? "km-KH" : "en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
}

function countCharacters(value: string): number {
  return Array.from(value.replace(/\s+/g, "")).length;
}

export default function SentenceCustomForm() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState("");

  const charCount = useMemo(() => countCharacters(value), [value]);
  const overLimit = charCount > MAX_CHARACTERS;
  const canStart = charCount > 0 && !overLimit;

  const handleStart = () => {
    if (!canStart) return;
    router.push(
      `/${locale}${ROUTES.sentenceSpelling.practice({ text: value.trim(), source: "custom" })}`
    );
  };

  const handleReuseHistory = (text: string) => {
    setValue(text);
  };

  const handlePracticeHistory = (text: string) => {
    router.push(`/${locale}${ROUTES.sentenceSpelling.practice({ text, source: "custom" })}`);
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
            {t("SENTENCE_SPELLING.CUSTOM.EYEBROW")}
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
            {t("SENTENCE_SPELLING.CUSTOM.TITLE")}
          </Typography>
          <Typography
            sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.sm, lineHeight: 1.45 }}
          >
            {t("SENTENCE_SPELLING.CUSTOM.DESCRIPTION")}
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
            <TextField
              fullWidth
              multiline
              minRows={4}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={t("SENTENCE_SPELLING.CUSTOM.PLACEHOLDER")}
              error={overLimit}
              slotProps={{
                input: {
                  sx: {
                    fontFamily: fontFamilies.khmer,
                    fontSize: KslFontSizes.md,
                    borderRadius: `${KslRadii.wordCard}px`,
                    "& fieldset": { borderColor: KslColors.border },
                  },
                },
              }}
            />
            <Typography
              sx={{
                alignSelf: "flex-end",
                color: overLimit ? "error.main" : KslColors.textSecondary,
                fontSize: KslFontSizes.xs,
                fontWeight: 700,
              }}
            >
              {charCount} / {MAX_CHARACTERS} {t("PHRASES.CHARACTERS")}
            </Typography>
          </Stack>

          <Button
            variant="contained"
            disabled={!canStart}
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
            {t("SENTENCE_SPELLING.CUSTOM.CTA")}
          </Button>
        </Stack>
      </Paper>

      {CUSTOM_SENTENCE_HISTORY.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${KslColors.border}`,
            borderRadius: `${KslRadii.card}px`,
            p: { xs: 2.25, md: 3 },
          }}
        >
          <Stack spacing={1.5}>
            <Stack spacing={0.25}>
              <Typography
                sx={{
                  color: KslColors.textPrimary,
                  fontSize: KslFontSizes.md,
                  fontWeight: 700,
                }}
              >
                {t("SENTENCE_SPELLING.CUSTOM.HISTORY_TITLE")}
              </Typography>
              <Typography
                sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.xs, lineHeight: 1.4 }}
              >
                {t("SENTENCE_SPELLING.CUSTOM.HISTORY_HINT")}
              </Typography>
            </Stack>

            <Stack spacing={1}>
              {CUSTOM_SENTENCE_HISTORY.map((entry) => (
                <Box
                  key={entry.id}
                  component="button"
                  type="button"
                  onClick={() => handleReuseHistory(entry.text)}
                  sx={{
                    alignItems: "center",
                    bgcolor: "background.paper",
                    border: `1px solid ${KslColors.border}`,
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
                        fontSize: KslFontSizes.md,
                        fontWeight: 500,
                        lineHeight: 1.4,
                      }}
                    >
                      {entry.text}
                    </Typography>
                    <Typography
                      sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.xs }}
                    >
                      {formatHistoryDate(entry.practicedAt, locale)}
                    </Typography>
                  </Stack>

                  <Box
                    component="span"
                    role="button"
                    aria-label={t("SENTENCE_SPELLING.CUSTOM.HISTORY_PRACTICE_AGAIN")}
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePracticeHistory(entry.text);
                    }}
                    sx={{
                      alignItems: "center",
                      bgcolor: KslColors.primaryLighter,
                      borderRadius: "50%",
                      color: KslColors.primary,
                      display: "flex",
                      flexShrink: 0,
                      height: 34,
                      justifyContent: "center",
                      width: 34,
                      "&:hover": { bgcolor: KslColors.primaryLight },
                    }}
                  >
                    <Iconify icon="solar:play-bold" sx={{ width: 16, height: 16 }} />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
