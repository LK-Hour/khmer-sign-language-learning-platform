"use client";

import { Box, Stack, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";
import type { ExerciseQuestionData, ExerciseAnswerResultData } from "../../types/exercise";
import ExerciseSignMedia from "./ExerciseSignMedia";

type Props = {
  question: ExerciseQuestionData;
  pairs: Record<string, number>;
  onSetPairs: (pairs: Record<string, number>) => void;
  reviewResult?: ExerciseAnswerResultData | null;
};

/**
 * Tap-to-pair matching: user taps a text label, then taps a media sign to pair them.
 * Pairs map: { leftOptionId (as string) → rightOptionId }
 * For this exercise, each option row is a pair (text + media on same row),
 * so left and right both reference the same option id.
 */
export default function ExerciseMatching({ question, pairs, onSetPairs, reviewResult }: Props) {
  const isReview = reviewResult != null;
  const [selectedLeftId, setSelectedLeftId] = useState<number | null>(null);

  // Build label list (text side) and media list (sign side), both shuffled differently
  const labelOptions = [...question.options].sort((a, b) => a.order_index - b.order_index);

  // Shuffle media options differently so they don't align with labels
  const mediaOptions = [...question.options].sort((a, b) => {
    const aKey = (a.id * 7 + 3) % question.options.length;
    const bKey = (b.id * 7 + 3) % question.options.length;
    return aKey - bKey;
  });

  function handleLabelTap(optId: number) {
    if (isReview) return;
    setSelectedLeftId(optId === selectedLeftId ? null : optId);
  }

  function handleMediaTap(mediaOptId: number) {
    if (isReview || selectedLeftId === null) return;
    const updated = { ...pairs, [String(selectedLeftId)]: mediaOptId };
    onSetPairs(updated);
    setSelectedLeftId(null);
  }

  function getPairedMediaId(labelOptId: number): number | null {
    return pairs[String(labelOptId)] ?? null;
  }

  function getMediaState(mediaOptId: number): "selected" | "correct" | "incorrect" | "neutral" {
    if (!isReview) {
      const isPaired = Object.values(pairs).includes(mediaOptId);
      return isPaired ? "selected" : "neutral";
    }
    // In review: correct = paired to itself, incorrect = wrong pairing
    const correctPair = mediaOptId; // each option is its own correct pair
    const submittedLabel = Object.entries(reviewResult!.matching_pairs ?? {}).find(
      ([, v]) => v === mediaOptId
    )?.[0];
    if (!submittedLabel) return "neutral";
    return Number(submittedLabel) === correctPair ? "correct" : "incorrect";
  }

  function getLabelState(labelOptId: number): "active" | "paired" | "correct" | "incorrect" | "neutral" {
    if (!isReview) {
      if (selectedLeftId === labelOptId) return "active";
      if (getPairedMediaId(labelOptId) !== null) return "paired";
      return "neutral";
    }
    const paired = reviewResult!.matching_pairs?.[String(labelOptId)];
    if (paired === undefined) return "neutral";
    return paired === labelOptId ? "correct" : "incorrect";
  }

  const labelColors = {
    active: { bg: KslColors.secondaryLight, border: KslColors.secondary, color: KslColors.secondary },
    paired: { bg: KslColors.primaryLight, border: KslColors.primary, color: KslColors.primary },
    correct: { bg: "#dff7ed", border: "#1f9f6f", color: KslColors.primary },
    incorrect: { bg: "#fff0ef", border: "#FF4438", color: KslColors.error },
    neutral: { bg: "#fff", border: KslColors.border, color: KslColors.textPrimary },
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "flex-start" }}>
        {/* Left: text labels */}
        <Stack spacing={1} sx={{ flex: 1 }}>
          {labelOptions.map((opt) => {
            const state = getLabelState(opt.id);
            const style = labelColors[state];
            const pairedMediaId = getPairedMediaId(opt.id);
            return (
              <Box
                key={opt.id}
                component={motion.button}
                whileTap={!isReview ? { scale: 0.96 } : {}}
                onClick={() => handleLabelTap(opt.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.5,
                  borderRadius: `${KslRadii.card}px`,
                  border: `2px solid ${style.border}`,
                  bgcolor: style.bg,
                  color: style.color,
                  cursor: isReview ? "default" : "pointer",
                  transition: "all 0.15s",
                  gap: 1,
                  textAlign: "left",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: fontFamilies.khmer,
                    fontSize: KslFontSizes.xl,
                    fontWeight: 700,
                  }}
                >
                  {opt.option_text_kh}
                </Typography>
                {pairedMediaId !== null && !isReview && (
                  <Typography sx={{ fontSize: KslFontSizes.xs, opacity: 0.7 }}>✓</Typography>
                )}
              </Box>
            );
          })}
        </Stack>

        {/* Right: sign media */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: question.options.length === 6 ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
              sm: question.options.length === 6 ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
            },
            gap: 1,
            flex: 1,
          }}
        >
          {mediaOptions.map((opt) => {
            const state = getMediaState(opt.id);
            return (
              <Box
                key={opt.id}
                component={motion.button}
                whileTap={!isReview && selectedLeftId !== null ? { scale: 0.95 } : {}}
                onClick={() => handleMediaTap(opt.id)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                  p: 0.5,
                  borderRadius: `${KslRadii.card}px`,
                  border: "2px solid transparent",
                  cursor: isReview ? "default" : selectedLeftId ? "crosshair" : "pointer",
                  bgcolor:
                    selectedLeftId && !isReview
                      ? "rgba(19,127,236,0.05)"
                      : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <ExerciseSignMedia
                  url={opt.media_url}
                  alt={opt.option_text_kh ?? "Sign"}
                  size={90}
                  reviewState={
                    state === "correct" ? "correct" : state === "incorrect" ? "incorrect" : "neutral"
                  }
                />
              </Box>
            );
          })}
        </Box>
      </Stack>

      {selectedLeftId !== null && !isReview && (
        <AnimatePresence>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            sx={{
              mt: 1.5,
              px: 2,
              py: 1,
              bgcolor: KslColors.secondaryLight,
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.secondary }}>
              Now tap the matching sign →
            </Typography>
          </Box>
        </AnimatePresence>
      )}
    </Box>
  );
}
