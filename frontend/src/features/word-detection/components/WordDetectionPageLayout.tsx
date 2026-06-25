"use client";

import { Chip, Stack, Typography } from "@mui/material";
import { PageContainer } from "@/components/layout";
import { useTranslation } from "@/i18n/useTranslation";
import { getLocalizedPair } from "@/i18n/localizedText";
import { formatUnitBadge } from "@/features/word-detection/utils/chapter";
import { KslColors, KslFontSizes, KslLineHeights } from "@/theme/theme";

type WordDetectionPageLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  titleKh?: string;
  headerVariant?: "default" | "compact" | "lesson";
  contextBadge?: string;
  contextUnitIndex?: number;
  contextTitle?: string;
  contextSubtitle?: string;
  contextTitleKh?: string;
};

export default function WordDetectionPageLayout({
  children,
  title,
  subtitle,
  titleKh,
  contextTitle,
  contextSubtitle,
  contextTitleKh,
  contextUnitIndex,
  contextBadge: contextBadgeProp,
}: WordDetectionPageLayoutProps) {
  const { t, locale } = useTranslation();

  const contextBadge =
    contextUnitIndex != null
      ? formatUnitBadge(contextUnitIndex, locale, t("WORD_DETECTION.LABELS.UNIT"))
      : contextBadgeProp;

  const header = titleKh
    ? getLocalizedPair(locale, title, titleKh)
    : { primary: title, secondary: subtitle };

  const context = contextTitle
    ? getLocalizedPair(locale, contextTitle, contextTitleKh ?? contextSubtitle ?? titleKh ?? subtitle)
    : null;

  return (
    <PageContainer>
      <Stack spacing={{ xs: 2.5, md: 3.5 }}>
        <Stack spacing={1}>
          {contextBadge ? (
            <Chip
              label={contextBadge}
              color="primary"
              variant="outlined"
              sx={{ alignSelf: "flex-start", fontWeight: 700 }}
            />
          ) : null}

          <Typography
            component="h1"
            sx={{
              color: KslColors.textPrimary,
              fontSize: { xs: 28, md: 36 },
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            {header.primary}
          </Typography>

          {header.secondary ? (
            <Typography
              sx={{
                maxWidth: 760,
                color: KslColors.textSecondary,
                fontSize: KslFontSizes.md,
                lineHeight: KslLineHeights.md,
              }}
            >
              {header.secondary}
            </Typography>
          ) : null}

          {context ? (
            <Stack
              sx={{
                mt: 1,
                p: 2,
                borderRadius: "8px",
                bgcolor: KslColors.surface,
                border: `1px solid ${KslColors.border}`,
              }}
            >
              <Typography
                sx={{
                  color: KslColors.textPrimary,
                  fontSize: KslFontSizes.md,
                  fontWeight: 700,
                  lineHeight: KslLineHeights.md,
                }}
              >
                {context.primary}
              </Typography>
              {context.secondary ? (
                <Typography
                  sx={{
                    color: KslColors.textSecondary,
                    fontSize: KslFontSizes.sm,
                    lineHeight: KslLineHeights.sm,
                  }}
                >
                  {context.secondary}
                </Typography>
              ) : null}
            </Stack>
          ) : null}
        </Stack>

        {children}
      </Stack>
    </PageContainer>
  );
}
