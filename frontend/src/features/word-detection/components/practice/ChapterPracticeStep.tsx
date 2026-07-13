"use client";

import { Alert, Grid, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import type { RefObject } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { labelsMatch } from "@/features/shared/usePredictionRetry";
import PracticeCorrectOverlay from "@/features/shared/PracticeCorrectOverlay";
import SignImageCard from "@/features/finger-spelling/components/learning/SignImageCard";
import { MetricCard, TipCard } from "@/features/finger-spelling/components/learning/PracticeInfoCards";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";
import type { WordDetectionLandmarks } from "../../ml/useWordDetectionLandmarker";
import type { WdPracticeItem } from "../../types";
import WdCameraPanel from "../learning/WordDetectionCameraPanel";

const VISUAL_FRAME_SX = {
  position: "relative" as const,
  width: "100%",
  height: { xs: 240, sm: 360, md: 460 },
  flexShrink: 0,
};

type ChapterPracticeStepProps = {
  item: WdPracticeItem;
  word: string;
  currentIndex: number;
  totalItems: number;
  continueEnabled?: boolean;
  retryWaiting?: boolean;
  displayLabel?: string | null;
  displayConfidence?: number | null;
  isLandmarkerReady?: boolean;
  recError?: string | null;
  videoRef?: RefObject<HTMLVideoElement | null>;
  detectLandmarks: Parameters<typeof WdCameraPanel>[0]["detectLandmarks"];
  onDetection?: (detection: WordDetectionLandmarks) => void;
  capturedLabel?: string | null;
  capturedConfidence?: number | null;
  liveLabel?: string | null;
  liveConfidence?: number;
  liveLabelMatches?: boolean | null;
  predictorReady?: boolean;
};

export default function ChapterPracticeStep({
  item,
  word,
  currentIndex,
  totalItems,
  continueEnabled = false,
  retryWaiting = false,
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
  const hasFinalResult = retryWaiting || hasCapturedPrediction || continueEnabled;
  const capturedMatchesTarget = labelsMatch(capturedLabel, word);
  const capturedIsNoAction = capturedLabel === "No Action";
  const capturedDisplayLabel = hasCapturedPrediction
    ? capturedMatchesTarget
      ? word
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
    predictorReady &&
    liveLabel &&
    liveLabelMatches !== null
  );
  const liveIsNoAction = liveLabel === "No Action";
  const liveDisplayLabel = liveLabelMatches
    ? word
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

  const tipText = t("WORD_DETECTION.PRACTICE.DEFAULT_TIP");
  const statusText = continueEnabled
    ? t("WORD_DETECTION.PRACTICE.PASSED")
    : liveLabelMatches
      ? t("WORD_DETECTION.PRACTICE.LOOKING_GOOD")
      : t("WORD_DETECTION.PRACTICE.HOLD_STILL");

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
        spacing={1}
        sx={{ alignItems: "baseline", flexWrap: "wrap" }}
      >
        <Typography
          component="span"
          sx={{
            color: KslColors.textPrimary,
            fontSize: { xs: KslFontSizes.lg, sm: KslFontSizes.xl },
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {t("WORD_DETECTION.PRACTICE.PROGRESS")}
        </Typography>
        <Typography
          component="span"
          sx={{
            color: KslColors.primary,
            fontSize: { xs: KslFontSizes["2xl"], sm: KslFontSizes["3xl"] },
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {currentIndex + 1}
        </Typography>
        <Typography
          component="span"
          sx={{
            color: KslColors.textSecondary,
            fontSize: { xs: KslFontSizes.lg, sm: KslFontSizes.xl },
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          /
        </Typography>
        <Typography
          component="span"
          sx={{
            color: KslColors.primaryDark,
            fontSize: { xs: KslFontSizes.xl, sm: 28 },
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {totalItems}
        </Typography>
      </Stack>

      {recError ? (
        <Alert severity="warning" sx={{ borderRadius: `${KslRadii.card}px` }}>
          {recError}
        </Alert>
      ) : null}

      {continueEnabled ? (
        <Alert
          severity="success"
          sx={{
            borderRadius: `${KslRadii.card}px`,
            bgcolor: "rgba(31,159,111,0.12)",
            border: `1px solid rgba(31,159,111,0.35)`,
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography sx={{ fontWeight: 800, color: KslColors.success }}>
            {t("WORD_DETECTION.PRACTICE.CORRECT_TITLE")}
          </Typography>
          <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.textSecondary }}>
            {t("WORD_DETECTION.PRACTICE.CORRECT_NEXT")}
          </Typography>
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack sx={VISUAL_FRAME_SX}>
            <SignImageCard
              src={item.practiceImageUrl}
              alt={`Word sign for ${word}`}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack sx={VISUAL_FRAME_SX}>
            <WdCameraPanel
              videoRef={videoRef}
              detectLandmarks={detectLandmarks}
              isLandmarkerReady={isLandmarkerReady}
              onDetection={onDetection}
            />
            <Typography
              sx={{
                position: "absolute",
                top: 12,
                left: 12,
                zIndex: 2,
                px: 1.25,
                py: 0.75,
                borderRadius: `${KslRadii.wordCard}px`,
                bgcolor: KslColors.surface,
                color:
                  continueEnabled || liveLabelMatches
                    ? KslColors.success
                    : KslColors.textPrimary,
                fontSize: KslFontSizes.sm,
                fontWeight: 700,
                lineHeight: 1.3,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.18)",
                maxWidth: "calc(100% - 24px)",
                pointerEvents: "none",
                transition: "color 0.2s ease",
              }}
            >
              {statusText}
            </Typography>
            <PracticeCorrectOverlay
              open={continueEnabled}
              title={t("WORD_DETECTION.PRACTICE.CORRECT_TITLE")}
              subtitle={t("WORD_DETECTION.PRACTICE.CORRECT_NEXT")}
              targetLabel={word}
            />
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <TipCard label={t("WORD_DETECTION.LESSON.TIP")} text={tipText} />
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
            khmerValue={!!cardLabel && cardLabel !== "No Action" && cardLabel !== t("BUTTON.TRY_AGAIN") && cardLabel !== t("PREDICTION.ANALYZING")}
            highlight={cardLabel != null && continueEnabled}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
