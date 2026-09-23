"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, Grid, Paper, Stack, Typography, alpha } from "@mui/material";
import Image from "next/image";
import Link from "next/link";

import Iconify from "@/components/iconify";
import { ROUTES } from "@/constants/routes";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

import { fetchLetterMedia } from "../api/media";
import { submitPracticeAttempt } from "../api/practice";
import { usePracticeTimer } from "../hooks/usePracticeTimer";
import { tokenizeKhmerSentence } from "../ml/tokenizeSentence";
import { computeAverageAccuracy } from "../utils/practiceStats";
import SentenceAccuracyChart from "./SentenceAccuracyChart";
import SentenceCompletionActions from "./SentenceCompletionActions";
import SentenceCompletionSummary from "./SentenceCompletionSummary";
import SentenceSpellingCameraPanel from "./SentenceSpellingCameraPanel";

const VISUAL_FRAME_SX = {
  position: "relative" as const,
  width: "100%",
  height: { xs: 200, sm: 300, md: 380 },
  flexShrink: 0,
};

type SentenceSpellingPracticeViewProps = {
  text: string;
  source: "sample" | "custom";
  sentenceId?: number;
  /** The next curated sentence, for sample practice only; `null` when there is none. */
  nextSentence?: { id: number; textKh: string } | null;
};

export default function SentenceSpellingPracticeView({
  text,
  source,
  sentenceId,
  nextSentence,
}: SentenceSpellingPracticeViewProps) {
  const { t, locale } = useTranslation();
  const characters = useMemo(() => tokenizeKhmerSentence(text.replace(/\s+/g, "")), [text]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [letterImages, setLetterImages] = useState<Record<string, string>>({});
  const [failedChar, setFailedChar] = useState<string | null>(null);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set());
  const [skippedIndices, setSkippedIndices] = useState<Set<number>>(new Set());
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const confidenceByIndexRef = useRef<Map<number, number>>(new Map());
  const hasSubmittedRef = useRef(false);
  const [accuracyPercent, setAccuracyPercent] = useState(0);
  const [accuracyByIndex, setAccuracyByIndex] = useState<ReadonlyMap<number, number>>(new Map());
  const { elapsedMs, start: startTimer, stop: stopTimer, reset: resetTimer } = usePracticeTimer();

  const backHref =
    source === "custom" ? ROUTES.sentenceSpelling.custom : ROUTES.sentenceSpelling.sample;
  const isComplete = characters.length > 0 && currentIndex >= characters.length;
  const currentChar = !isComplete ? characters[currentIndex] : undefined;
  // Highest character index ever reached (including the one currently being
  // practiced), so navigating back never forgets how far the learner got.
  if (currentIndex > maxReachedIndex) {
    setMaxReachedIndex(currentIndex);
  }
  const currentCharImageUrl = currentChar ? letterImages[currentChar] : undefined;
  const imageFailed = currentChar !== undefined && currentChar === failedChar;

  useEffect(() => {
    if (characters.length === 0) return;
    let cancelled = false;
    fetchLetterMedia(characters)
      .then((map) => {
        if (!cancelled) setLetterImages(map);
      })
      .catch(() => {
        // Best-effort — falls back to showing the glyph when the lookup fails.
      });
    return () => {
      cancelled = true;
    };
  }, [characters]);

  const advance = useCallback(() => {
    setCurrentIndex((index) => Math.min(index + 1, characters.length));
  }, [characters.length]);

  // Freezes the clock and the average once the last character is passed.
  // Must run after that character's confidence has been recorded.
  const finishIfLast = useCallback(() => {
    if (currentIndex !== characters.length - 1) return;
    stopTimer();
    setAccuracyPercent(computeAverageAccuracy(confidenceByIndexRef.current, characters.length));
    setAccuracyByIndex(new Map(confidenceByIndexRef.current));
  }, [characters.length, currentIndex, stopTimer]);

  const handleConfirm = useCallback(
    (confidence: number) => {
      confidenceByIndexRef.current.set(currentIndex, confidence);
      setCompletedIndices((prev) => new Set(prev).add(currentIndex));
      setSkippedIndices((prev) => {
        if (!prev.has(currentIndex)) return prev;
        const next = new Set(prev);
        next.delete(currentIndex);
        return next;
      });
      finishIfLast();
      advance();
    },
    [advance, currentIndex, finishIfLast]
  );

  const handleSkip = () => {
    confidenceByIndexRef.current.set(currentIndex, 0);
    setSkippedIndices((prev) => new Set(prev).add(currentIndex));
    setCompletedIndices((prev) => {
      if (!prev.has(currentIndex)) return prev;
      const next = new Set(prev);
      next.delete(currentIndex);
      return next;
    });
    finishIfLast();
    advance();
  };

  const handleRestart = () => {
    confidenceByIndexRef.current = new Map();
    hasSubmittedRef.current = false;
    resetTimer();
    setAccuracyPercent(0);
    setAccuracyByIndex(new Map());
    setCompletedIndices(new Set());
    setSkippedIndices(new Set());
    setMaxReachedIndex(0);
    setCurrentIndex(0);
  };

  const goToCharacter = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Memoized so the chart isn't handed fresh data (and re-animated) on every render.
  const accuracyPoints = useMemo(
    () =>
      characters.map((char, index) => ({
        char,
        accuracy: accuracyByIndex.get(index) ?? 0,
        skipped: skippedIndices.has(index),
      })),
    [accuracyByIndex, characters, skippedIndices]
  );

  useEffect(() => {
    if (!isComplete || hasSubmittedRef.current || characters.length === 0) return;
    hasSubmittedRef.current = true;

    submitPracticeAttempt({
      source,
      sentenceId: source === "sample" ? sentenceId : undefined,
      practicedText: text,
      characterCount: characters.length,
      accuracyPercent: computeAverageAccuracy(confidenceByIndexRef.current, characters.length),
    }).catch(() => {
      // Best-effort — a failed submission shouldn't block the completion screen.
    });
  }, [isComplete, source, sentenceId, text, characters.length]);

  if (characters.length === 0) {
    return (
      <Stack spacing={2}>
        <Typography sx={{ color: KslColors.textSecondary }}>
          {t("SENTENCE_SPELLING.PRACTICE.EMPTY")}
        </Typography>
        <Button
          component={Link}
          href={`/${locale}${backHref}`}
          variant="outlined"
          sx={{
            alignSelf: "flex-start",
            borderColor: KslColors.border,
            borderRadius: `${KslRadii.button}px`,
            color: KslColors.primaryDark,
            fontWeight: 700,
          }}
        >
          {t("SENTENCE_SPELLING.BACK")}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }} sx={{ width: "100%" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack spacing={1}>
          <Typography
            sx={{
              color: KslColors.primaryDark,
              fontFamily: fontFamilies.sans,
              fontSize: KslFontSizes.md,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {t("SENTENCE_SPELLING.PRACTICE.EYEBROW")}
          </Typography>
          <Typography
            component="h1"
            sx={{
              color: KslColors.textPrimary,
              fontFamily: fontFamilies.khmer,
              fontSize: { xs: 22, md: 30 },
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {text}
          </Typography>
        </Stack>

        <Button
          component={Link}
          href={`/${locale}${backHref}`}
          startIcon={<Iconify icon="akar-icons:arrow-back-thick-fill" sx={{ width: 16, height: 16 }} />}
          variant="outlined"
          sx={{
            borderColor: KslColors.border,
            borderRadius: `${KslRadii.button}px`,
            color: KslColors.primaryDark,
            fontWeight: 700,
            px: 2.5,
            py: 1.25,
            flexShrink: 0,
          }}
        >
          {t("SENTENCE_SPELLING.BACK")}
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${KslColors.border}`,
          borderRadius: `${KslRadii.card}px`,
          p: { xs: 2.25, md: 3 },
        }}
      >
        <Stack spacing={3} sx={{ alignItems: "center" }}>
          <Stack
            direction="row"
            sx={{ flexWrap: "wrap", justifyContent: "center", columnGap: 1, rowGap: 1 }}
          >
            {characters?.map((char, index) => {
              const state =
                index === currentIndex
                  ? "now"
                  : completedIndices.has(index)
                    ? "done"
                    : skippedIndices.has(index)
                      ? "skipped"
                      : "upcoming";
              // Reachable = already attempted (confirmed or skipped) at some
              // point, not just "before wherever we currently are" — so
              // navigating back to an earlier character doesn't lock out
              // characters already passed further ahead. Locked once the
              // sentence is finished.
              const isClickable =
                !isComplete && index <= maxReachedIndex && index !== currentIndex;
              return (
                <Stack
                  key={`${char}-${index}`}
                  onClick={isClickable ? () => goToCharacter(index) : undefined}
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={
                    isClickable
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            goToCharacter(index);
                          }
                        }
                      : undefined
                  }
                  sx={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: 52,
                    height: isComplete ? 68 : 52,
                    borderRadius: `${KslRadii.wordCard}px`,
                    fontFamily: fontFamilies.khmer,
                    fontSize: KslFontSizes.lg,
                    fontWeight: 600,
                    cursor: isClickable ? "pointer" : "default",
                    transition: "opacity 0.15s ease",
                    ...(isClickable ? { "&:hover": { opacity: 0.8 } } : {}),
                    border: `1px solid ${
                      state === "now"
                        ? KslColors.primary
                        : state === "skipped"
                          ? KslColors.fail
                          : KslColors.border
                    }`,
                    bgcolor:
                      state === "done"
                        ? KslColors.primaryLighter
                        : state === "now"
                          ? KslColors.primaryLight
                          : state === "skipped"
                            ? alpha(KslColors.fail, 0.12)
                            : "background.paper",
                    color:
                      state === "upcoming"
                        ? KslColors.textSecondary
                        : state === "skipped"
                          ? KslColors.fail
                          : KslColors.textPrimary,
                  }}
                >
                  {char}
                  {isComplete && (
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: fontFamilies.sans,
                        fontSize: KslFontSizes.xs,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        mt: 0.75,
                        opacity: 0.85,
                      }}
                    >
                      {Math.round(Math.min(100, Math.max(0, accuracyByIndex.get(index) ?? 0)))}%
                    </Typography>
                  )}
                </Stack>
              );
            })}
          </Stack>

          {!isComplete ? (
            <Stack spacing={2.5} sx={{ width: "100%" }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Stack spacing={1}>
                    <Stack sx={VISUAL_FRAME_SX}>
                      <Stack
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          borderRadius: `${KslRadii.signImage}px`,
                          bgcolor: KslColors.primaryLighter,
                          border: `2px solid ${KslColors.primary}`,
                        }}
                      >
                        {currentChar && currentCharImageUrl && !imageFailed ? (
                          <Image
                            key={currentChar}
                            src={resolveApiAssetUrl(currentCharImageUrl) ?? currentCharImageUrl}
                            alt={currentChar}
                            fill
                            sizes="(max-width: 900px) 100vw, 33vw"
                            style={{ objectFit: "contain", padding: 16 }}
                            onError={() => setFailedChar(currentChar)}
                            priority
                          />
                        ) : (
                          <Typography
                            sx={{
                              fontFamily: fontFamilies.khmer,
                              fontSize: { xs: 56, md: 72, lg: 80 },
                              fontWeight: 700,
                              color: KslColors.primaryDark,
                            }}
                          >
                            {currentChar}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                    <Typography
                      sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.sm, lineHeight: 1.55 }}
                    >
                      {t("SENTENCE_SPELLING.PRACTICE.SAMPLE_CAPTION")}
                    </Typography>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <Stack spacing={1}>
                    <Stack sx={VISUAL_FRAME_SX}>
                      <SentenceSpellingCameraPanel
                        targetLabel={currentChar ?? ""}
                        onConfirm={handleConfirm}
                        onReady={startTimer}
                      />
                    </Stack>
                    <Typography
                      sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.sm, lineHeight: 1.55 }}
                    >
                      {t("SENTENCE_SPELLING.PRACTICE.CAMERA_CAPTION")}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>

              <Paper
                elevation={0}
                sx={{
                  alignItems: { xs: "flex-start", sm: "center" },
                  bgcolor: KslColors.primaryLighter,
                  border: `1px solid ${KslColors.border}`,
                  borderRadius: `${KslRadii.card}px`,
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  justifyContent: "space-between",
                  p: 2,
                }}
              >
                <Typography
                  sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.sm, fontWeight: 700 }}
                >
                  {currentIndex + 1} / {characters.length}
                </Typography>

                <Button
                  variant="outlined"
                  onClick={handleSkip}
                  sx={{
                    borderColor: KslColors.border,
                    borderRadius: `${KslRadii.button}px`,
                    color: KslColors.textSecondary,
                    flexShrink: 0,
                    fontWeight: 700,
                    px: 3,
                    py: 1,
                  }}
                >
                  {t("SENTENCE_SPELLING.PRACTICE.SKIP")}
                </Button>
              </Paper>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ alignItems: "center" }}>
              <Iconify
                icon="solar:cup-star-bold"
                sx={{ width: 56, height: 56, color: KslColors.success }}
              />
              <Typography
                sx={{ color: KslColors.textPrimary, fontSize: KslFontSizes.lg, fontWeight: 700 }}
              >
                {t("SENTENCE_SPELLING.PRACTICE.COMPLETE")}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Paper>

      {isComplete ? (
        <>
          <SentenceCompletionSummary
            accuracyPercent={accuracyPercent}
            completedCount={completedIndices.size}
            skippedCount={skippedIndices.size}
            totalCount={characters.length}
            elapsedMs={elapsedMs}
          />
          <SentenceAccuracyChart points={accuracyPoints} sentence={text} />
          <SentenceCompletionActions
            onRestart={handleRestart}
            backHref={`/${locale}${backHref}`}
            next={
              nextSentence
                ? {
                    label: nextSentence.textKh,
                    href: `/${locale}${ROUTES.sentenceSpelling.practice({
                      text: nextSentence.textKh,
                      source: "sample",
                      sentenceId: nextSentence.id,
                    })}`,
                  }
                : null
            }
          />
        </>
      ) : null}
    </Stack>
  );
}
