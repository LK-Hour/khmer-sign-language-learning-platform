"use client";

import { Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import PlayButton from "@/components/ui/PlayButton";
import { ROUTES } from "@/constants/routes";
import type { DictionaryWord } from "@/features/dictionary/types";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";

type DictionaryListItemProps = {
  word: DictionaryWord;
};

export default function DictionaryListItem({ word }: DictionaryListItemProps) {
  const href = ROUTES.dictionaryWord(word.id);

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <Paper
        elevation={0}
        component={Stack}
        direction="row"
        sx={{
          alignItems: "center",
          gap: { xs: 1.5, md: 2 },
          px: { xs: 2, md: 2.5 },
          py: { xs: 1.5, md: 2 },
          mb: 1.5,
          bgcolor: "background.paper",
          borderRadius: `${KslRadii.card}px`,
          boxShadow: KslShadows.card,
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          border: `1px solid transparent`,
          "&:hover": {
            borderColor: KslColors.primary,
            boxShadow: KslShadows.drop,
          },
        }}
      >
        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: KslFontSizes.md,
            fontWeight: 700,
            color: KslColors.secondary,
            lineHeight: 1.25,
          }}
        >
          {word.textEn}
        </Typography>

        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            textAlign: "center",
            fontSize: KslFontSizes.md,
            fontWeight: 700,
            color: KslColors.secondary,
            lineHeight: 1.25,
          }}
        >
          {word.textKh}
        </Typography>

        <PlayButton />
      </Paper>
    </Link>
  );
}
