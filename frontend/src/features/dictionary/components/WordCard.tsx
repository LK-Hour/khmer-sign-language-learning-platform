"use client";

import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { ButtonBase, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { forwardRef, useRef, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { useDictionaryWordLabels } from "@/features/dictionary/utils/useDictionaryEntryLabels";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslPalette, KslRadii } from "@/theme/theme";

import type { DictionaryWord } from "../types";
import { gridItem, springSnappy } from "./dictionaryMotion";

type WordCardProps = {
  word: DictionaryWord;
  /** Optional caption under the labels, e.g. the unit name in "All". */
  caption?: string;
};

/**
 * Word videos are ~3 MB and the API does not serve byte ranges, so the
 * video is only requested once the learner hovers or focuses the card.
 */
const WordCard = forwardRef<HTMLDivElement, WordCardProps>(function WordCard(
  { word, caption },
  ref,
) {
  const { locale } = useTranslation();
  const { primary, secondary } = useDictionaryWordLabels(word);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wantsVideo, setWantsVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const startPreview = () => {
    if (!word.videoUrl) return;
    setWantsVideo(true);
    void videoRef.current?.play().catch(() => undefined);
  };

  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
  };

  return (
    <motion.div
      ref={ref}
      layout
      variants={gridItem}
      exit="exit"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      style={{ height: "100%" }}
      onHoverStart={startPreview}
      onHoverEnd={stopPreview}
    >
      <ButtonBase
        component={Link}
        href={`/${locale}${ROUTES.dictionaryWord(word.id)}`}
        onFocus={startPreview}
        onBlur={stopPreview}
        sx={{
          width: "100%",
          height: "100%",
          flexDirection: "column",
          alignItems: "stretch",
          textAlign: "left",
          overflow: "hidden",
          borderRadius: `${KslRadii.card}px`,
          border: `1px solid ${KslColors.border}`,
          bgcolor: "background.paper",
          transition: "border-color 0.2s, box-shadow 0.2s",
          "&:hover, &.Mui-focusVisible": {
            borderColor: KslColors.primary,
            boxShadow: "0 10px 28px rgba(20, 40, 76, 0.12)",
          },
          "&.Mui-focusVisible": {
            outline: `2px solid ${KslColors.primary}`,
            outlineOffset: 2,
          },
        }}
      >
        <Stack
          sx={{
            position: "relative",
            aspectRatio: "4 / 3",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: KslPalette.primary.lighter,
            borderBottom: `1px solid ${KslColors.border}`,
          }}
        >
          <Typography
            component="span"
            lang="km"
            aria-hidden
            sx={{
              px: 2,
              fontSize: { xs: 30, md: 36 },
              fontWeight: 600,
              lineHeight: 1.3,
              textAlign: "center",
              color: KslPalette.primary.dark,
              opacity: 0.85,
            }}
          >
            {word.textKh}
          </Typography>

          {wantsVideo && word.videoUrl ? (
            <motion.video
              ref={videoRef}
              src={word.videoUrl}
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              onPlaying={() => setIsPlaying(true)}
              initial={false}
              animate={{ opacity: isPlaying ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                background: "#000",
              }}
            />
          ) : null}

          <AnimatePresence>
            {!isPlaying && word.videoUrl ? (
              <motion.span
                key="badge"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={springSnappy}
                style={{ position: "absolute", right: 10, bottom: 10, display: "flex" }}
              >
                <Stack
                  component="span"
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "background.paper",
                    color: KslColors.primary,
                    boxShadow: "0 2px 8px rgba(20, 40, 76, 0.16)",
                  }}
                >
                  <PlayArrowRoundedIcon sx={{ fontSize: 22 }} />
                </Stack>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </Stack>

        <Stack spacing={0.25} sx={{ px: 2, py: 1.5 }}>
          <Typography
            component="span"
            sx={{
              fontSize: KslFontSizes.md,
              fontWeight: 700,
              lineHeight: 1.35,
              color: KslColors.textPrimary,
            }}
          >
            {primary}
          </Typography>
          {secondary ? (
            <Typography component="span" sx={{ fontSize: KslFontSizes.sm, color: KslColors.textSecondary }}>
              {secondary}
            </Typography>
          ) : null}
          {caption ? (
            <Typography
              component="span"
              sx={{ pt: 0.5, fontSize: KslFontSizes.xs, fontWeight: 600, color: KslColors.primary }}
            >
              {caption}
            </Typography>
          ) : null}
        </Stack>
      </ButtonBase>
    </motion.div>
  );
});

export default WordCard;
