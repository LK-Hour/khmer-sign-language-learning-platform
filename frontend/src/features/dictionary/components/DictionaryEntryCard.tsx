"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { useDictionaryWordLabels } from "@/features/dictionary/utils/useDictionaryEntryLabels";
import { useDictionaryChipLabel } from "@/features/dictionary/utils/useDictionaryChipLabel";
import { useTranslation } from "@/i18n/useTranslation";
import {
  KslColors,
  KslFontSizes,
  KslLineHeights,
  KslPalette,
  KslRadii,
  KslShadows,
} from "@/theme/theme";

import type { DictionaryWord } from "../types";

type DictionaryEntryCardProps = {
  word: DictionaryWord;
};

function entryAccent(entryType: DictionaryWord["entryType"]) {
  if (entryType === "word") {
    return {
      chipBg: KslPalette.status.inProgress,
      chipColor: KslColors.textPrimary,
      stripe: `linear-gradient(90deg, ${KslPalette.status.inProgress} 0%, #ffe08a 100%)`,
    };
  }

  return {
    chipBg: KslPalette.primary.light,
    chipColor: KslColors.primaryDark,
    stripe: `linear-gradient(90deg, ${KslColors.primary} 0%, ${KslPalette.primary.light} 100%)`,
  };
}

export default function DictionaryEntryCard({ word }: DictionaryEntryCardProps) {
  const { t } = useTranslation();
  const entryType = word.entryType ?? "character";
  const { primary, secondary } = useDictionaryWordLabels(word);
  const href = ROUTES.dictionaryWord(word.id);
  const accent = entryAccent(entryType);
  const chipLabel = useDictionaryChipLabel(word);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: `${KslRadii.card}px`,
        border: `1px solid ${KslColors.border}`,
        boxShadow: "none",
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: KslShadows.drop,
          borderColor: KslColors.primary,
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={href}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <Stack
          aria-hidden
          sx={{
            height: 4,
            background: accent.stripe,
          }}
        />

        <CardContent sx={{ flex: 1, p: { xs: 2, md: 2.5 } }}>
          <Stack spacing={1.5} sx={{ height: "100%" }}>
            <Chip
              label={chipLabel}
              size="small"
              sx={{
                alignSelf: "flex-start",
                height: 26,
                fontWeight: 700,
                fontSize: KslFontSizes.xs,
                bgcolor: accent.chipBg,
                color: accent.chipColor,
              }}
            />

            <Stack spacing={0.5} sx={{ flex: 1 }}>
              <Typography
                component="h2"
                sx={{
                  fontSize: { xs: KslFontSizes.lg, md: KslFontSizes.xl },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: KslColors.textPrimary,
                }}
              >
                {primary}
              </Typography>

              {secondary ? (
                <Typography
                  sx={{
                    fontSize: KslFontSizes.md,
                    fontWeight: 600,
                    color: KslColors.secondary,
                    lineHeight: KslLineHeights.md,
                  }}
                >
                  {secondary}
                </Typography>
              ) : null}

              {word.description ? (
                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: KslFontSizes.sm,
                    lineHeight: KslLineHeights.sm,
                    color: KslColors.textSecondary,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {word.description}
                </Typography>
              ) : null}
            </Stack>

            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                alignItems: "center",
                pt: 1,
                color: KslColors.primary,
              }}
            >
              <Typography
                sx={{
                  fontSize: KslFontSizes.sm,
                  fontWeight: 700,
                }}
              >
                {t("dictViewSign")}
              </Typography>
              <ArrowForwardIcon sx={{ fontSize: 18 }} />
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
