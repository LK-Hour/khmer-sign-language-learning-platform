"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import PlayButton from "@/components/ui/PlayButton";
import { ROUTES } from "@/constants/routes";
import type { DictionaryWord } from "@/features/dictionary/types";
import { kslColors, kslFontSizes, kslRadii, kslShadows } from "@/theme/theme";

type DictionaryListItemProps = {
  word: DictionaryWord;
};

export default function DictionaryListItem({ word }: DictionaryListItemProps) {
  const href = ROUTES.dictionaryWord(word.id);

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1.5, md: 2 },
          px: { xs: 2, md: 2.5 },
          py: { xs: 1.5, md: 2 },
          mb: 1.5,
          bgcolor: "background.paper",
          borderRadius: `${kslRadii.card}px`,
          boxShadow: kslShadows.card,
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          border: `1px solid transparent`,
          "&:hover": {
            borderColor: kslColors.primary,
            boxShadow: kslShadows.drop,
          },
        }}
      >
        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: kslFontSizes.md,
            fontWeight: 700,
            color: kslColors.secondary,
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
            fontSize: kslFontSizes.md,
            fontWeight: 700,
            color: kslColors.secondary,
            lineHeight: 1.25,
          }}
        >
          {word.textKh}
        </Typography>

        <PlayButton />
      </Box>
    </Link>
  );
}
