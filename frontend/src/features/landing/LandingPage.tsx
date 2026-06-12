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

import LandingModeCard from "./LandingModeCard";

const HERO_IMAGE = "/assets/landing-hero-hand.png";

export default function LandingPage() {
  const { t, locale } = useTranslation();

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
                {t("landingEyebrow")}
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
                {t("landingTitle")}
              </Typography>

              <Typography
                sx={{
                  fontSize: KslFontSizes.md,
                  lineHeight: KslLineHeights.md,
                  color: KslColors.textSecondary,
                }}
              >
                {t("landingSubtitle")}
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
                  {t("landingFingerSpellingCta")}
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
                  {t("landingWordDetectionCta")}
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
                alt={t("landingHeroAlt")}
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
            <LandingModeCard
              href={fingerSpellingHref}
              modeLabel={t("landingMode01")}
              title={t("navFingerSpelling")}
              description={t("landingFingerSpellingDesc")}
              stat={t("landingFingerSpellingStat")}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <LandingModeCard
              href={wordDetectionHref}
              modeLabel={t("landingMode02")}
              title={t("navWordDetection")}
              description={t("landingWordDetectionDesc")}
              stat={t("landingWordDetectionStat")}
            />
          </Grid>
        </Grid>
      </Stack>
    </PageContainer>
  );
}
