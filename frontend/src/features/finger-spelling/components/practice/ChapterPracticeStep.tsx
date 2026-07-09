"use client";

import { Alert, Grid, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import type { RefObject } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { labelsMatch } from "@/features/shared/usePredictionRetry";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";
import type { RawHandDetection } from "@/features/finger-spelling/ml/useHandLandmarker";
import type { FsPracticeItem } from "../../types";
import LessonWebcamPanel from "../learning/LessonWebcamPanel";
import { MetricCard, TipCard } from "../learning/PracticeInfoCards";
import SignImageCard from "../learning/SignImageCard";

const VISUAL_FRAME_SX = {
  position: "relative" as const,
  width: "100%",
  height: { xs: 240, sm: 360, md: 460 },
  flexShrink: 0,
};

type ChapterPracticeStepProps = {
  item: FsPracticeItem;
  letter: string;
  currentIndex: number;
  totalItems: number;
  accuracy: number | null;
  isSubmitting?: boolean;
  retryWaiting?: boolean;
  continueEnabled?: boolean;
  displayLabel?: string | null;
  displayConfidence?: number | null;
  isLandmarkerReady?: boolean;
  recError?: string | null;
  videoRef?: RefObject<HTMLVideoElement | null>;
  detectLandmarks: (video: HTMLVideoElement) => RawHandDetection;
  onDetection?: (detection: RawHandDetection) => void;
  capturedLabel?: string | null;
  capturedConfidence?: number | null;
  liveLabel?: string | null;
  liveConfidence?: number;
  liveLabelMatches?: boolean | null;
  predictorReady?: boolean;
};

export default function ChapterPracticeStep({
  item,
  letter,
  currentIndex,
  totalItems,
  accuracy,
  isSubmitting = false,
  retryWaiting = false,
  continueEnabled = false,
  displayLabel = null,
  displayConfidence = null,
  isLandmarkerReady = false,
  recError = null,
  videoRef,
  detectLandmarks,
  onDetection,
  capturedLabel,
  capturedConfidence = null,
  liveLabel,
  liveConfidence = 0,
  liveLabelMatches = null,
  predictorReady = false,
}: ChapterPracticeStepProps) {
  const { t } = useTranslation();

  const hasCapturedPrediction = !!capturedLabel && capturedConfidence != null;
  const hasFinalResult = accuracy != null || retryWaiting || hasCapturedPrediction;
  const capturedMatchesTarget = labelsMatch(capturedLabel, letter);
  const capturedIsNoAction = capturedLabel === "No Action";
  const capturedDisplayLabel = hasCapturedPrediction
    ? capturedMatchesTarget
      ? letter
      : capturedIsNoAction
        ? "No Action"
        : t("BUTTON.TRY_AGAIN")
    : null;
  const capturedDisplayConfidence = hasCapturedPrediction
    ? capturedMatchesTarget
      ? Math.round(capturedConfidence)
      : 0
    : null;

  const showLivePrediction = !!(
    !hasFinalResult &&
    !isSubmitting &&
    predictorReady &&
    liveLabel &&
    liveLabelMatches !== null
  );
  const liveIsNoAction = liveLabel === "No Action";
  const liveDisplayLabel = liveLabelMatches
    ? letter
    : liveIsNoAction
      ? "No Action"
      : t("PREDICTION.ANALYZING");
  const liveDisplayConfidence = liveLabelMatches ? Math.round(liveConfidence) : 0;

  const cardConfidence = showLivePrediction
    ? liveDisplayConfidence
    : displayConfidence ?? capturedDisplayConfidence;
  const cardLabel = showLivePrediction
    ? liveDisplayLabel
    : displayLabel ?? capturedDisplayLabel;

  const tipText = t("FINGER_SPELLING.LESSON.DEFAULT_PRACTICE_TIP");

  const statusText = continueEnabled
    ? t("FINGER_SPELLING.PRACTICE.PASSED")
    : t("FINGER_SPELLING.LESSON.HOLD_STILL");

  return (
    <Stack
      component={motion.div}
      spacing={2}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      sx={{ mt: 2 }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography
          sx={{
            color: KslColors.textSecondary,
            fontSize: KslFontSizes.sm,
            fontWeight: 600,
          }}
        >
          {t("FINGER_SPELLING.PRACTICE.PROGRESS")} {currentIndex + 1} / {totalItems}
        </Typography>

        <Typography
          sx={{
            color: continueEnabled ? KslColors.success : KslColors.textSecondary,
            fontSize: KslFontSizes.sm,
            fontWeight: 700,
            transition: "color 0.2s ease",
          }}
        >
          {statusText}
        </Typography>
      </Stack>

      {recError ? (
        <Alert severity="warning" sx={{ borderRadius: `${KslRadii.card}px` }}>
          {recError}
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack sx={VISUAL_FRAME_SX}>
            <SignImageCard
              src={item.practiceImageUrl}
              alt={`Character sign for ${letter}`}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack sx={VISUAL_FRAME_SX}>
            <LessonWebcamPanel
              videoRef={videoRef}
              detectLandmarks={detectLandmarks}
              isLandmarkerReady={isLandmarkerReady}
              onDetection={onDetection}
            />
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <TipCard label={t("FINGER_SPELLING.LESSON.TIP")} text={tipText} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <MetricCard
            label={t("FINGER_SPELLING.LESSON.MATCH_CONFIDENCE")}
            value={cardConfidence != null ? `${cardConfidence}%` : "—"}
            highlight={continueEnabled}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <MetricCard
            label={t("FINGER_SPELLING.LESSON.PREDICT_RESULT")}
            value={cardLabel ?? "—"}
            highlight={cardLabel != null && continueEnabled}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
