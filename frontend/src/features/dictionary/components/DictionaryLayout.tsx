"use client";

import { Stack, Typography } from "@mui/material";

import { PageContainer } from "@/components/layout";
import { useTranslation } from "@/i18n/useTranslation";
import {
  KslColors,
  KslFontSizes,
  KslLineHeights,
  KslPalette,
  KslRadii,
} from "@/theme/theme";

type DictionaryLayoutProps = {
  children: React.ReactNode;
  /** When false, skips the browse hero (detail pages). */
  showHero?: boolean;
};

export default function DictionaryLayout({
  children,
  showHero = true,
}: DictionaryLayoutProps) {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <Stack spacing={{ xs: 3, md: 4 }}>
        {showHero ? (
          <Stack
            spacing={2}
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: `${KslRadii.card}px`,
              px: { xs: 2.5, md: 4 },
              py: { xs: 3, md: 4 },
              bgcolor: KslPalette.primary.lighter,
              border: `1px solid ${KslPalette.primary.light}`,
            }}
          >
            <Stack
              aria-hidden
              sx={{
                pointerEvents: "none",
                position: "absolute",
                top: -48,
                right: -32,
                width: 220,
                height: 220,
                borderRadius: "50%",
                bgcolor: KslPalette.primary.light,
                opacity: 0.45,
              }}
            />
            <Stack
              aria-hidden
              sx={{
                pointerEvents: "none",
                position: "absolute",
                bottom: -64,
                left: "18%",
                width: 160,
                height: 160,
                borderRadius: "50%",
                bgcolor: KslPalette.secondary.light,
                opacity: 0.35,
              }}
            />

            <Stack spacing={1} sx={{ position: "relative", zIndex: 1 }}>
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
                {t("DICTIONARY.LIST.EYEBROW")}
              </Typography>

              <Typography
                component="h1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: 28, sm: 32, md: 36 },
                  lineHeight: 1.15,
                  color: KslColors.textPrimary,
                }}
              >
                {t("DICTIONARY.LIST.HEADLINE")}
              </Typography>

              <Typography
                sx={{
                  fontSize: KslFontSizes.md,
                  lineHeight: KslLineHeights.md,
                  color: KslColors.textSecondary,
                }}
              >
                {t("DICTIONARY.LIST.SUBHEADLINE")}
              </Typography>
            </Stack>
          </Stack>
        ) : null}

        {children}
      </Stack>
    </PageContainer>
  );
}
