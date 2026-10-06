"use client";

import { ButtonBase, Stack, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { forwardRef } from "react";

import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslPalette } from "@/theme/theme";

import type { DictionaryWord } from "../types";
import { gridItem, springSnappy } from "./dictionaryMotion";

type CharacterTileProps = {
  word: DictionaryWord;
  /** Highlights the entry being viewed on a detail page. */
  current?: boolean;
};

function SignPreview({ word }: { word: DictionaryWord }) {
  return (
    <Stack spacing={1} sx={{ alignItems: "center", p: 0.5 }}>
      <Stack
        sx={{
          position: "relative",
          width: 148,
          height: 148,
          borderRadius: "12px",
          overflow: "hidden",
          bgcolor: KslPalette.primary.lighter,
        }}
      >
        {word.mediaUrl ? (
          <Image
            src={word.mediaUrl}
            alt=""
            fill
            sizes="148px"
            style={{ objectFit: "contain" }}
          />
        ) : null}
      </Stack>
      <Typography sx={{ fontSize: KslFontSizes.sm, fontWeight: 700, color: KslColors.textPrimary }}>
        {word.textKh} · {word.textEn}
      </Typography>
    </Stack>
  );
}

/**
 * Alphabet-style tile: the glyph is the hero, romanization underneath,
 * and the hand-shape image previews on hover/focus.
 */
const CharacterTile = forwardRef<HTMLDivElement, CharacterTileProps>(
  function CharacterTile({ word, current = false }, ref) {
    const { locale } = useTranslation();

    return (
      <Tooltip
        title={<SignPreview word={word} />}
        placement="top"
        enterDelay={250}
        enterNextDelay={120}
        describeChild
        slotProps={{
          tooltip: {
            sx: {
              bgcolor: "background.paper",
              color: KslColors.textPrimary,
              border: `1px solid ${KslColors.border}`,
              borderRadius: "16px",
              boxShadow: "0 12px 32px rgba(20, 40, 76, 0.18)",
              p: 1,
            },
          },
        }}
      >
        <motion.div
          ref={ref}
          layout
          variants={gridItem}
          exit="exit"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.94 }}
          transition={springSnappy}
          style={{ height: "100%" }}
        >
          <ButtonBase
            component={Link}
            href={`/${locale}${ROUTES.dictionaryWord(word.id)}`}
            aria-current={current ? "page" : undefined}
            sx={{
              width: "100%",
              height: "100%",
              aspectRatio: "1 / 1",
              flexDirection: "column",
              gap: 0.25,
              px: 0.5,
              borderRadius: "14px",
              border: `1px solid ${current ? KslColors.primary : KslColors.border}`,
              bgcolor: current ? KslPalette.primary.light : "background.paper",
              transition: "border-color 0.2s, background-color 0.2s, box-shadow 0.2s",
              "&:hover, &.Mui-focusVisible": {
                borderColor: KslColors.primary,
                bgcolor: current ? KslPalette.primary.light : KslPalette.primary.lighter,
                boxShadow: "0 6px 18px rgba(31, 159, 111, 0.16)",
              },
              "&.Mui-focusVisible": {
                outline: `2px solid ${KslColors.primary}`,
                outlineOffset: 2,
              },
            }}
          >
            <Typography
              component="span"
              lang="km"
              sx={{
                fontSize: { xs: 28, md: 34 },
                lineHeight: 1.25,
                fontWeight: 600,
                color: current ? KslColors.primaryDark : KslColors.textPrimary,
              }}
            >
              {word.textKh}
            </Typography>
            <Typography
              component="span"
              title={word.textEn}
              sx={{
                maxWidth: "100%",
                fontSize: KslFontSizes.xs,
                color: KslColors.textSecondary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {word.textEn}
            </Typography>
          </ButtonBase>
        </motion.div>
      </Tooltip>
    );
  },
);

export default CharacterTile;
