"use client";

import {
  Button,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import type { DictionaryWord } from "@/features/dictionary/types";
import { useDictionaryWordLabels } from "@/features/dictionary/utils/useDictionaryEntryLabels";
import { useTranslation } from "@/i18n/useTranslation";
import {
  KslColors,
  KslFontSizes,
  KslLineHeights,
  KslPalette,
  KslRadii,
} from "@/theme/theme";

type DictionaryWordDetailProps = {
  word: DictionaryWord;
};

type SidebarCardProps = {
  label: string;
  title: string;
  children: React.ReactNode;
};

function SidebarCard({ label, title, children }: SidebarCardProps) {
  return (
    <Paper
      elevation={0}
      component={Stack}
      spacing={2}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: `${KslRadii.card}px`,
        border: `1px solid ${KslColors.border}`,
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={0.75}>
        <Typography
          sx={{
            fontSize: KslFontSizes.xs,
            fontWeight: 700,
            textTransform: "uppercase",
            color: KslColors.textSecondary,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: KslFontSizes.lg,
            fontWeight: 700,
            lineHeight: KslLineHeights.lg,
            color: KslColors.textPrimary,
          }}
        >
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
  showDivider?: boolean;
};

function InfoRow({ label, value, showDivider = true }: InfoRowProps) {
  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", justifyContent: "space-between", py: 0.25 }}
      >
        <Typography
          sx={{
            fontSize: KslFontSizes.sm,
            color: KslColors.textSecondary,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: KslFontSizes.sm,
            fontWeight: 700,
            color: KslColors.textPrimary,
            textAlign: "right",
          }}
        >
          {value}
        </Typography>
      </Stack>
      {showDivider ? <Divider sx={{ borderColor: KslColors.border }} /> : null}
    </>
  );
}

export default function DictionaryWordDetail({ word }: DictionaryWordDetailProps) {
  const { t, locale } = useTranslation();
  const { primary, secondary } = useDictionaryWordLabels(word);
  const isVideo = Boolean(word.videoUrl);
  const mediaSrc = word.videoUrl ?? word.mediaUrl ?? null;
  const typeLabel =
    word.entryType === "character"
      ? t("DICTIONARY.LIST.TYPE_CHARACTER")
      : t("DICTIONARY.LIST.TYPE_WORD");
  const eyebrow =
    word.entryType === "character"
      ? t("DICTIONARY.DETAIL.CHARACTER_EYEBROW")
      : t("DICTIONARY.DETAIL.WORD_EYEBROW");
  const subtitle = word.description ?? secondary ?? "";
  const practiceHref =
    word.lessonId != null
      ? `/${locale}${ROUTES.fingerSpelling.lesson(word.lessonId)}`
      : null;

  return (
    <Stack spacing={{ xs: 3, md: 4 }} sx={{ width: "100%" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", md: "flex-start" },
          justifyContent: "space-between",
        }}
      >
        <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component="span"
            sx={{
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: KslColors.primary,
            }}
          >
            {eyebrow}
          </Typography>

          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 36, md: 44 },
              fontWeight: 700,
              lineHeight: 1.1,
              color: KslColors.textPrimary,
            }}
          >
            {primary}
          </Typography>

          {subtitle ? (
            <Typography
              sx={{
                maxWidth: 640,
                fontSize: KslFontSizes.md,
                lineHeight: KslLineHeights.md,
                color: KslColors.textSecondary,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Stack>

        <Button
          component={Link}
          href={`/${locale}${ROUTES.dictionary}`}
          variant="outlined"
          sx={{
            alignSelf: { xs: "flex-start", md: "flex-start" },
            flexShrink: 0,
            px: 2.5,
            py: 1,
            borderRadius: `${KslRadii.button}px`,
            borderColor: KslColors.primary,
            color: KslColors.primary,
            fontWeight: 700,
            fontSize: KslFontSizes.sm,
            textTransform: "none",
            "&:hover": {
              borderColor: KslColors.primaryDark,
              bgcolor: KslPalette.primary.lighter,
            },
          }}
        >
          {t("DICTIONARY.DETAIL.BACK_TO_DICTIONARY")}
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={0}
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: { xs: "1 / 1", lg: "4 / 3" },
              minHeight: { xs: 280, sm: 320, md: 360, lg: 480 },
              borderRadius: `${KslRadii.signImage}px`,
              overflow: "hidden",
              bgcolor: KslPalette.primary.lighter,
              border: `1px solid ${KslPalette.primary.light}`,
            }}
          >
            {mediaSrc ? (
              isVideo ? (
                <video
                  src={mediaSrc}
                  controls
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <Stack
                  sx={{
                    position: "absolute",
                    inset: 0,
                  }}
                >
                  <Stack
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <Image
                      src={mediaSrc}
                      alt={word.textEn}
                      fill
                      sizes="(max-width: 900px) 100vw, (max-width: 1200px) 66vw, 800px"
                      style={{
                        objectFit: "cover",
                      }}
                      priority
                    />
                  </Stack>
                </Stack>
              )
            ) : (
              <Stack
                sx={{
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 3,
                }}
              >
                <Typography
                  sx={{
                    fontSize: KslFontSizes.md,
                    lineHeight: KslLineHeights.md,
                    color: KslColors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  {t("DICTIONARY.DETAIL.MEDIA_UNAVAILABLE")}
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2} sx={{ height: "100%" }}>
            <SidebarCard
              label={t("DICTIONARY.DETAIL.LEARNING_INFO_LABEL")}
              title={t("DICTIONARY.DETAIL.LEARNING_TRACK_FINGER_SPELLING")}
            >
              <Stack spacing={0}>
                <InfoRow label={t("DICTIONARY.DETAIL.TYPE_LABEL")} value={typeLabel} />
                <InfoRow
                  label={t("DICTIONARY.DETAIL.DIFFICULTY_LABEL")}
                  value={t("DICTIONARY.DETAIL.DIFFICULTY_BEGINNER")}
                  showDivider={false}
                />
              </Stack>
            </SidebarCard>

            <SidebarCard
              label={t("DICTIONARY.DETAIL.SUGGESTION_LABEL")}
              title={t("DICTIONARY.DETAIL.SUGGESTION_TITLE")}
            >
              <Typography
                sx={{
                  fontSize: KslFontSizes.sm,
                  lineHeight: KslLineHeights.sm,
                  color: KslColors.textSecondary,
                }}
              >
                {t("DICTIONARY.DETAIL.SUGGESTION_BODY")}
              </Typography>
            </SidebarCard>

            {practiceHref ? (
              <Button
                component={Link}
                href={practiceHref}
                variant="contained"
                fullWidth
                sx={{
                  mt: "auto",
                  py: 1.75,
                  borderRadius: `${KslRadii.button}px`,
                  bgcolor: KslColors.primary,
                  fontWeight: 700,
                  fontSize: KslFontSizes.md,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: KslColors.primaryDark,
                    boxShadow: "none",
                  },
                }}
              >
                {t("DICTIONARY.DETAIL.PRACTICE_SIGN")}
              </Button>
            ) : null}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
