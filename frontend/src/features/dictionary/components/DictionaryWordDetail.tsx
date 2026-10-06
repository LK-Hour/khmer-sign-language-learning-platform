"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Box, Button, ButtonBase, Stack, Typography } from "@mui/material";
import { MotionConfig, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes";
import type { DictionaryWord } from "@/features/dictionary/types";
import { useDictionaryWordLabels } from "@/features/dictionary/utils/useDictionaryEntryLabels";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslLineHeights, KslPalette, KslRadii } from "@/theme/theme";

import { getDictionaryCategoryLabel } from "../utils/categoryLabel";
import { getDictionaryDescription } from "../utils/dictionaryList";
import CharacterTile from "./CharacterTile";
import { fadeUp, springSoft, staggerGrid } from "./dictionaryMotion";
import SignVideoPlayer from "./SignVideoPlayer";
import WordCard from "./WordCard";

type DictionaryWordDetailProps = {
  word: DictionaryWord;
  previous: DictionaryWord | null;
  next: DictionaryWord | null;
  /** Entries from the same unit, in curriculum order (includes `word`). */
  siblings: DictionaryWord[];
};

function StepLink({
  word,
  direction,
}: {
  word: DictionaryWord | null;
  direction: "previous" | "next";
}) {
  const { t, locale } = useTranslation();
  const isNext = direction === "next";
  const label = isNext ? t("DICTIONARY.DETAIL.NEXT") : t("DICTIONARY.DETAIL.PREVIOUS");

  return (
    <ButtonBase
      component={word ? Link : "span"}
      href={word ? `/${locale}${ROUTES.dictionaryWord(word.id)}` : undefined}
      aria-label={word ? `${label}: ${word.textKh}` : label}
      aria-disabled={!word}
      disabled={!word}
      sx={{
        gap: 0.5,
        px: 1.25,
        py: 0.75,
        borderRadius: "999px",
        border: `1px solid ${KslColors.border}`,
        color: KslColors.textPrimary,
        opacity: word ? 1 : 0.4,
        transition: "border-color 0.2s, background-color 0.2s",
        "&:hover": { borderColor: KslColors.primary, bgcolor: KslPalette.primary.lighter },
      }}
    >
      {!isNext ? <ChevronLeftRoundedIcon fontSize="small" /> : null}
      <Typography component="span" lang="km" sx={{ fontSize: KslFontSizes.sm, fontWeight: 700 }}>
        {word ? word.textKh : label}
      </Typography>
      {isNext ? <ChevronRightRoundedIcon fontSize="small" /> : null}
    </ButtonBase>
  );
}

export default function DictionaryWordDetail({
  word,
  previous,
  next,
  siblings,
}: DictionaryWordDetailProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { primary, secondary } = useDictionaryWordLabels(word);
  const isWord = word.entryType === "word";
  const categoryLabel = getDictionaryCategoryLabel(word.category, t);
  const description = getDictionaryDescription(word);
  const dictionaryHref = `/${locale}${ROUTES.dictionary}${isWord ? "?tab=words" : ""}`;
  const practiceHref =
    word.lessonId != null
      ? `/${locale}${isWord ? ROUTES.words.lesson(word.lessonId) : ROUTES.fingerSpelling.lesson(word.lessonId)}`
      : null;
  const related = isWord ? siblings.filter((sibling) => sibling.id !== word.id).slice(0, 8) : siblings;
  const meta = [
    isWord ? t("DICTIONARY.LIST.TYPE_WORD") : t("DICTIONARY.LIST.TYPE_CHARACTER"),
    categoryLabel,
    word.level != null ? t("DICTIONARY.DETAIL.CHAPTER").replace("{n}", String(word.level)) : null,
  ].filter(Boolean);

  // ← / → step through the dictionary like flash cards.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const destination =
        event.key === "ArrowLeft" ? previous : event.key === "ArrowRight" ? next : null;
      if (destination) router.push(`/${locale}${ROUTES.dictionaryWord(destination.id)}`);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previous, next, locale, router]);

  return (
    <MotionConfig reducedMotion="user">
      <Stack spacing={{ xs: 3, md: 4 }} sx={{ width: "100%" }}>
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}
          >
            <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, minWidth: 0 }}>
              <Button
                component={Link}
                href={dictionaryHref}
                startIcon={<ArrowBackRoundedIcon />}
                aria-label={t("DICTIONARY.DETAIL.BACK_TO_DICTIONARY")}
                sx={{ px: 1.25, color: KslColors.textPrimary, fontSize: KslFontSizes.sm }}
              >
                {t("DICTIONARY.LIST.HEADLINE")}
              </Button>
              {categoryLabel ? (
                <>
                  <Typography aria-hidden sx={{ color: KslColors.border }}>
                    /
                  </Typography>
                  <Typography
                    noWrap
                    sx={{ fontSize: KslFontSizes.sm, fontWeight: 600, color: KslColors.textSecondary }}
                  >
                    {categoryLabel}
                  </Typography>
                </>
              ) : null}
            </Stack>
            <Stack direction="row" sx={{ gap: 1 }}>
              <StepLink word={previous} direction="previous" />
              <StepLink word={next} direction="next" />
            </Stack>
          </Stack>
        </motion.div>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 5 },
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 8fr) minmax(0, 4fr)" },
            alignItems: "center",
          }}
        >
          <motion.div
            key={word.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springSoft}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: isWord ? "4 / 3" : "1 / 1",
                maxHeight: { md: 560 },
                borderRadius: `${KslRadii.signImage}px`,
                overflow: "hidden",
                bgcolor: KslPalette.primary.lighter,
                border: `1px solid ${KslPalette.primary.light}`,
              }}
            >
              {word.videoUrl ? (
                <SignVideoPlayer src={word.videoUrl} label={word.textEn} />
              ) : word.mediaUrl ? (
                <Image
                  src={word.mediaUrl}
                  alt={`${word.textKh} (${word.textEn})`}
                  fill
                  preload
                  sizes="(max-width: 900px) 100vw, 60vw"
                  style={{ objectFit: "contain", padding: "6%" }}
                />
              ) : (
                <Stack sx={{ height: "100%", alignItems: "center", justifyContent: "center", px: 3 }}>
                  <Typography sx={{ color: KslColors.textSecondary, textAlign: "center" }}>
                    {t("DICTIONARY.DETAIL.MEDIA_UNAVAILABLE")}
                  </Typography>
                </Stack>
              )}
            </Box>
          </motion.div>

          <motion.div variants={staggerGrid(0.08)} initial="hidden" animate="show" key={`info-${word.id}`}>
            <Stack spacing={2.5}>
              <motion.div variants={fadeUp}>
                <Typography
                  component="h1"
                  lang={isWord ? undefined : "km"}
                  sx={{
                    fontSize: isWord ? { xs: 40, md: 52 } : { xs: 88, md: 120 },
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: KslColors.textPrimary,
                  }}
                >
                  {primary}
                </Typography>
                {secondary ? (
                  <Typography
                    sx={{ mt: 1, fontSize: KslFontSizes.xl, fontWeight: 600, color: KslColors.secondary }}
                  >
                    {secondary}
                  </Typography>
                ) : null}
              </motion.div>

              <motion.div variants={fadeUp}>
                <Typography sx={{ fontSize: KslFontSizes.sm, fontWeight: 600, color: KslColors.textSecondary }}>
                  {meta.join(" · ")}
                </Typography>
                {description ? (
                  <Typography
                    sx={{
                      mt: 1.5,
                      maxWidth: 520,
                      fontSize: KslFontSizes.md,
                      lineHeight: KslLineHeights.md,
                      color: KslColors.textPrimary,
                    }}
                  >
                    {description}
                  </Typography>
                ) : null}
              </motion.div>

              {practiceHref ? (
                <motion.div variants={fadeUp}>
                  <Button
                    component={Link}
                    href={practiceHref}
                    variant="contained"
                    disableElevation
                    size="large"
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{
                      px: 3.5,
                      py: 1.5,
                      "& .MuiButton-endIcon": { transition: "transform 0.2s" },
                      "&:hover .MuiButton-endIcon": { transform: "translateX(4px)" },
                    }}
                  >
                    {t("DICTIONARY.DETAIL.PRACTICE_SIGN")}
                  </Button>
                </motion.div>
              ) : null}
            </Stack>
          </motion.div>
        </Box>

        {related.length > 0 ? (
          <Box
            component="section"
            sx={{
              pt: { xs: 1, md: 2 },
              "& .dictionary-related-grid": {
                gridTemplateColumns: isWord
                  ? { xs: "repeat(auto-fill, minmax(150px, 1fr))", md: "repeat(auto-fill, minmax(220px, 1fr))" }
                  : { xs: "repeat(auto-fill, minmax(72px, 1fr))", md: "repeat(auto-fill, minmax(88px, 1fr))" },
              },
            }}
          >
            <Typography
              component="h2"
              sx={{ mb: 2, fontSize: KslFontSizes.lg, fontWeight: 700, color: KslColors.textPrimary }}
            >
              {t("DICTIONARY.DETAIL.RELATED").replace("{category}", categoryLabel)}
            </Typography>
            <motion.div
              className="dictionary-related-grid"
              variants={staggerGrid(isWord ? 0.05 : 0.014)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              style={{ display: "grid", gap: isWord ? 16 : 10 }}
            >
              {related.map((sibling) =>
                isWord ? (
                  <WordCard key={sibling.id} word={sibling} />
                ) : (
                  <CharacterTile key={sibling.id} word={sibling} current={sibling.id === word.id} />
                ),
              )}
            </motion.div>
          </Box>
        ) : null}
      </Stack>
    </MotionConfig>
  );
}
