"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import BackButton from "@/components/ui/BackButton";
import { ROUTES } from "@/constants/routes";
import type { DictionaryWord } from "@/features/dictionary/types";
import { useLocalizedPair } from "@/i18n/useLocalizedPair";
import { useTranslation } from "@/i18n/useTranslation";
import {
  kslColors,
  kslFontSizes,
  kslRadii,
  kslShadows,
} from "@/theme/theme";

const FALLBACK_MEDIA = "/finger-spelling/placeholder-sign.svg";

type DictionaryWordDetailProps = {
  word: DictionaryWord;
};

export default function DictionaryWordDetail({ word }: DictionaryWordDetailProps) {
  const { t } = useTranslation();
  const { primary, secondary } = useLocalizedPair(word.textEn, word.textKh);
  const mediaSrc = word.videoUrl ?? word.mediaUrl ?? FALLBACK_MEDIA;
  const isVideo = Boolean(word.videoUrl);

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <BackButton
        href={ROUTES.dictionary}
        aria-label={t("fsDictionaryBack")}
      />

      <Box
        sx={{
          mt: 1,
          borderRadius: `${kslRadii.signImage}px`,
          overflow: "hidden",
          boxShadow: kslShadows.card,
          bgcolor: "background.paper",
          aspectRatio: "4 / 3",
          position: "relative",
        }}
      >
        {isVideo ? (
          <Box
            component="video"
            src={mediaSrc}
            controls
            playsInline
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              bgcolor: "#000",
            }}
          />
        ) : (
          <Image
            src={mediaSrc}
            alt={word.textEn}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            style={{ objectFit: "cover" }}
            priority
          />
        )}
      </Box>

      <Box
        sx={{
          mt: 2,
          mx: "auto",
          maxWidth: 418,
          border: `4px solid rgba(250, 171, 97, 0.5)`,
          borderRadius: `${kslRadii.wordCard}px`,
          boxShadow: kslShadows.button,
          px: { xs: 4, md: 8 },
          py: 1.5,
          textAlign: "center",
          bgcolor: "background.paper",
        }}
      >
        <Typography
          component="p"
          sx={{
            fontSize: kslFontSizes.lg,
            fontWeight: 700,
            color: kslColors.secondary,
            lineHeight: 1.25,
          }}
        >
          {primary}
        </Typography>
        {secondary && (
          <Typography
            component="p"
            sx={{
              mt: 0.5,
              fontSize: kslFontSizes.md,
              fontWeight: 400,
              color: kslColors.textSecondary,
              lineHeight: 1.25,
            }}
          >
            {secondary}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
