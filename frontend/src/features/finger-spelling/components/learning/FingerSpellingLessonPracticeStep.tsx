"use client";

import {
  Alert,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import type { RefObject } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { labelsMatch } from "@/features/shared/usePredictionRetry";
import {
  KslColors,
  KslFontSizes,
  KslRadii,
} from "@/theme/theme";
import type {
  RawHandDetection,
} from "@/features/finger-spelling/ml/useHandLandmarker";
import type { StabilityState } from "@/features/finger-spelling/ml/useStabilityDetector";
import FingerSpellingCameraPanel from "./FingerSpellingCameraPanel";
import FingerSpellingPracticeFeedbackPanel from "./FingerSpellingPracticeFeedbackPanel";
import { MetricCard, TipCard } from "./FingerSpellingPracticeInfoCards";
import FingerSpellingSignImageCard from "./FingerSpellingSignImageCard";

const VISUAL_FRAME_SX = {
  position: "relative" as const,
  width: "100%",
  height: { xs: 240, sm: 360, md: 460 },
  flexShrink: 0,
};

type FingerSpellingLessonPracticeStepProps = {
  letter: string;
  imageUrl: string;
  tip?: string | null;
  accuracy: number | null;
  cameraResetKey: number;
  isSubmitting?: boolean;
  isContinuing?: boolean;
  retryWaiting?: boolean;
  continueEnabled?: boolean;
  displayLabel?: string | null;
  displayConfidence?: number | null;
  isLandmarkerReady?: boolean;
  recError?: string | null;
  videoRef?: RefObject<HTMLVideoElement | null>;
  detectLandmarks: (video: HTMLVideoElement) => RawHandDetection;
  onDetection?: (detection: RawHandDetection) => void;
  stabilityState: StabilityState;
  stabilityProgress: number;
  continueLabel: string;
  onRetry: () => void;
  onContinue: () => void | Promise<void>;
  /** Prediction snapshot that triggered auto-capture. */
  capturedLabel?: string | null;
  capturedConfidence?: number | null;
  /** Live prediction label from WebSocket (shown in realtime before capture). */
  liveLabel?: string | null;
  /** Live prediction confidence from WebSocket (shown in realtime before capture). */
  liveConfidence?: number;
  /** Whether the live prediction matches this lesson's target label. */
  liveLabelMatches?: boolean | null;
  /** Whether the WebSocket predictor is connected and ready. */
  predictorReady?: boolean;
};

export default function FingerSpellingLessonPracticeStep({
  letter,
  imageUrl,
  tip,
  accuracy,
  cameraResetKey,
  isSubmitting = false,
  isContinuing = false,
  retryWaiting = false,
  continueEnabled = false,
  displayLabel = null,
  displayConfidence = null,
  isLandmarkerReady = false,
  recError = null,
  videoRef,
  detectLandmarks,
  onDetection,
  stabilityState,
  stabilityProgress,
  continueLabel,
  onRetry,
  onContinue,
  capturedLabel,
  capturedConfidence = null,
  liveLabel,
  liveConfidence = 0,
  liveLabelMatches = null,
  predictorReady = false,
}: FingerSpellingLessonPracticeStepProps) {
  const { t } = useTranslation();

  const hasCapturedPrediction = !!capturedLabel && capturedConfidence != null;
  const hasFinalResult = accuracy != null || retryWaiting || hasCapturedPrediction;
  const canContinue = continueEnabled;
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
  const correctionText = canContinue
    ? t("FINGER_SPELLING.LESSON.CORRECTION_PASSED")
    : hasFinalResult
      ? t("FINGER_SPELLING.LESSON.CORRECTION_ALMOST")
      : t("FINGER_SPELLING.LESSON.HOLD_STILL");
  const tipText =
    tip?.trim() ||
    t("FINGER_SPELLING.LESSON.DEFAULT_PRACTICE_TIP");
  const showStabilityProgress =
    !hasFinalResult && !isSubmitting;

  // Determine what to show in the MetricCards
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
  const showRetry = canContinue && hasFinalResult;

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
      {recError ? (
        <Alert severity="warning" sx={{ borderRadius: `${KslRadii.card}px` }}>
          {recError}
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={1}>
            <Stack sx={VISUAL_FRAME_SX}>
              <FingerSpellingSignImageCard src={imageUrl} alt={`This is sign for ${letter}`} />
            </Stack>
            <Typography
              sx={{
                color: KslColors.textSecondary,
                fontSize: KslFontSizes.sm,
                lineHeight: 1.55,
              }}
            >
              {t("FINGER_SPELLING.LESSON.SAMPLE_CAPTION")}
            </Typography>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={1}>
            <Stack sx={VISUAL_FRAME_SX}>
              <FingerSpellingCameraPanel
                resetKey={cameraResetKey}
                videoRef={videoRef}
                detectLandmarks={detectLandmarks}
                isLandmarkerReady={isLandmarkerReady}
                onDetection={onDetection}
              />
            </Stack>

            {showStabilityProgress && stabilityState !== "idle" && (
              <Stack spacing={0.5}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.textSecondary, fontWeight: 600 }}>
                    {stabilityState === "waiting" && t("FINGER_SPELLING.LESSON.HOLD_STILL")}
                    {stabilityState === "stable" && t("FINGER_SPELLING.LESSON.STABLE_HOLD")}
                    {stabilityState === "timeout" && t("FINGER_SPELLING.LESSON.STABILITY_TIMEOUT")}
                  </Typography>
                  {stabilityState === "waiting" && (
                    <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.textSecondary }}>
                      {stabilityProgress}%
                    </Typography>
                  )}
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={stabilityProgress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: "rgba(196, 196, 196, 0.05)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: stabilityState === "stable" ? KslColors.primary : KslColors.textSecondary,
                      borderRadius: 3,
                    },
                  }}
                />
              </Stack>
            )}

            <Typography
              sx={{
                color: KslColors.textSecondary,
                fontSize: KslFontSizes.sm,
                lineHeight: 1.55,
              }}
            >
              {t("FINGER_SPELLING.LESSON.CAMERA_CAPTION")}
            </Typography>
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
            highlight={canContinue}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <MetricCard
            label={t("FINGER_SPELLING.LESSON.PREDICT_RESULT")}
            value={cardLabel ?? "—"}
            highlight={cardLabel != null && canContinue}
          />
        </Grid>
      </Grid>

      <FingerSpellingPracticeFeedbackPanel
        title={t("FINGER_SPELLING.LESSON.CORRECTION_RESULT")}
        text={correctionText}
        continueLabel={continueLabel}
        retryLabel={t("BUTTON.TRY_AGAIN")}
        passed={canContinue}
        showRetry={showRetry}
        isSubmitting={isSubmitting}
        isContinuing={isContinuing}
        onRetry={onRetry}
        onContinue={onContinue}
      />
    </Stack>
  );
}
