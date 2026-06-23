"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Box,
  Button,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { PageContainer } from "@/components/layout";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslLineHeights, KslRadii } from "@/theme/theme";

import { useFingerSpellingProgressStat } from "./hooks/useFingerSpellingProgressStat";
import LearningModeCard from "./LearningModeCard";

const HERO_IMAGE = "/assets/landing-hero-hand.png";

export default function LandingPage() {
  const { t, locale } = useTranslation();
  const { stat: fingerSpellingStat } = useFingerSpellingProgressStat();

  const fingerSpellingHref = `/${locale}${ROUTES.fingerSpelling.root}`;
  const wordDetectionHref = `/${locale}${ROUTES.words.root}`;

  return (
    <PageContainer>
      <Stack spacing={{ xs: 3, md: 4 }}>
        <Grid
          container
          spacing={{ xs: 2, md: 3 }}
          sx={{ alignItems: "center" }}
        >
          <Grid
            size={{ xs: 12, md: 6}}
            sx={{ minWidth: 0, position: "relative", zIndex: 1 }}
          >
            <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ alignItems: "flex-start" }}>
              <Typography
                component="span"
                sx={{
                  fontSize: KslFontSizes.lg, 
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: KslColors.primary,
                }}
              >
                {t("HOME.EYEBROW")}
              </Typography>

              <Typography
                component="h1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 32, sm: 36, md: 40 },
                  lineHeight: 1.15,
                  color: KslColors.textPrimary,
                }}
              >
                {t("HOME.TITLE")}
              </Typography>

              <Typography
                sx={{
                  fontSize: KslFontSizes.md,
                  lineHeight: KslLineHeights.md,
                  color: KslColors.textSecondary,
                }}
              >
                {t("HOME.SUBTITLE")}
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                useFlexGap
                sx={{ pt: 0.5, width: "100%", flexWrap: "wrap" }}
              >
                <Button
                  component={Link}
                  href={fingerSpellingHref}
                  variant="contained"
                  color="primary"
                  sx={{
                    px: 3,
                    py: 1.5,
                    minHeight: 56,
                    borderRadius: "8px",
                    fontWeight: 700,
                    flex: { xs: "1 1 100%", sm: "0 1 auto" },
                    whiteSpace: { xs: "normal", sm: "nowrap" },
                  }}
                >
                  {t("HOME.FINGER_SPELLING_CTA")}
                </Button>

                <Button
                  component={Link}
                  href={wordDetectionHref}
                  variant="outlined"
                  sx={{
                    px: 3,
                    py: 1.5,
                    minHeight: 56,
                    borderRadius: "8px",
                    borderWidth: 2,
                    borderColor: KslColors.primary,
                    color: KslColors.primary,
                    fontWeight: 700,
                    flex: { xs: "1 1 100%", sm: "0 1 auto" },
                    whiteSpace: { xs: "normal", sm: "nowrap" },
                    "&:hover": {
                      borderWidth: 2,
                      borderColor: KslColors.primaryDark,
                      bgcolor: KslColors.primaryLighter,
                    },
                  }}
                >
                  {t("HOME.WORD_DETECTION_CTA")}
                </Button>
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: { xs: 220, sm: 280, md: 320, lg: 380 },
                borderRadius: `${KslRadii.card}px`,
                overflow: "hidden",
                bgcolor: "#0a1628",
                isolation: "isolate",
              }}
            >
              <Image
                src={HERO_IMAGE}
                alt={t("HOME.HERO_ALT")}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: "cover", objectPosition: "center" }}
              />
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <LearningModeCard
              href={fingerSpellingHref}
              modeLabel={t("HOME.MODE_01")}
              title={t("NAV.FINGER_SPELLING")}
              description={t("HOME.FINGER_SPELLING_DESC")}
              stat={fingerSpellingStat}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <LearningModeCard
              href={wordDetectionHref}
              modeLabel={t("HOME.MODE_02")}
              title={t("NAV.WORD_DETECTION")}
              description={t("HOME.WORD_DETECTION_DESC")}
              stat={t("HOME.WORD_DETECTION_STAT")}
            />
          </Grid>
        </Grid>
      </Stack>
    </PageContainer>
  );
}
