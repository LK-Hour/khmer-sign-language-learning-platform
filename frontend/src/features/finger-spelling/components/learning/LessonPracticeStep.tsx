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
import {
  KslColors,
  KslFontSizes,
  KslRadii,
} from "@/theme/theme";
import type {
  RawHandDetection,
} from "@/features/finger-spelling/ml/useHandLandmarker";
import type { StabilityState } from "@/features/finger-spelling/ml/useStabilityDetector";
import LessonWebcamPanel from "./LessonWebcamPanel";
import PracticeFeedbackPanel from "./PracticeFeedbackPanel";
import { MetricCard, TipCard } from "./PracticeInfoCards";
import SignImageCard from "./SignImageCard";
import { useAnimatedScore } from "./useAnimatedScore";

const VISUAL_FRAME_SX = {
  position: "relative" as const,
  width: "100%",
  height: { xs: 240, sm: 360, md: 460 },
  flexShrink: 0,
};

type LessonPracticeStepProps = {
  letter: string;
  imageUrl: string;
  tip?: string | null;
  accuracy: number | null;
  predictedLetter: string | null;
  passThreshold: number;
  cameraResetKey: number;
  isSubmitting?: boolean;
  isContinuing?: boolean;
  isLandmarkerReady?: boolean;
  recError?: string | null;
  videoRef?: RefObject<HTMLVideoElement | null>;
  detectLandmarks: (video: HTMLVideoElement) => RawHandDetection;
  onDetection?: (detection: RawHandDetection) => void;
  stabilityState: StabilityState;
  stabilityProgress: number;
  onRetry: () => void;
  onContinue: () => void | Promise<void>;
};

export default function LessonPracticeStep({
  letter,
  imageUrl,
  tip,
  accuracy,
  predictedLetter,
  passThreshold,
  cameraResetKey,
  isSubmitting = false,
  isContinuing = false,
  isLandmarkerReady = false,
  recError = null,
  videoRef,
  detectLandmarks,
  onDetection,
  stabilityState,
  stabilityProgress,
  onRetry,
  onContinue,
}: LessonPracticeStepProps) {
  const { t } = useTranslation();
  const displayConfidence = useAnimatedScore(accuracy);

  const passed = accuracy != null && accuracy >= passThreshold;

  const correctionText = passed
    ? t("fsCorrectionPassed")
    : accuracy != null
      ? t("fsCorrectionAlmost")
      : t("fsHoldStill");
  const tipText =
    tip?.trim() ||
    t("fsDefaultPracticeTip");
  const stabilityLabel = !isLandmarkerReady
    ? t("fsLandmarkerLoading")
    : isSubmitting
      ? t("fsEvaluating")
      : stabilityState === "stable"
        ? t("fsStableHold")
        : stabilityState === "timeout"
          ? t("fsStabilityTimeout")
          : t("fsHoldStill");
  const showStabilityProgress =
    accuracy == null && !isSubmitting;

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
              <SignImageCard src={imageUrl} alt={`Sign for ${letter}`} />
            </Stack>
            <Typography
              sx={{
                color: KslColors.textSecondary,
                fontSize: KslFontSizes.sm,
                lineHeight: 1.55,
              }}
            >
              {t("fsSampleCaption")}
            </Typography>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={1}>
            <Stack sx={VISUAL_FRAME_SX}>
              <LessonWebcamPanel
                resetKey={cameraResetKey}
                videoRef={videoRef}
                detectLandmarks={detectLandmarks}
                isLandmarkerReady={isLandmarkerReady}
                onDetection={onDetection}
              />
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  right: 12,
                  zIndex: 3,
                  alignItems: "center",
                  justifyContent: "space-between",
                  pointerEvents: "none",
                }}
              >
                <Typography
                  sx={{
                    px: 1.25,
                    py: 0.65,
                    borderRadius: 999,
                    bgcolor: "rgba(0,0,0,0.58)",
                    color: "#fff",
                    fontSize: KslFontSizes.xs,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {stabilityLabel}
                </Typography>
                {showStabilityProgress ? (
                  <Typography
                    sx={{
                      px: 1,
                      py: 0.55,
                      borderRadius: 999,
                      bgcolor: "rgba(255,255,255,0.82)",
                      color: KslColors.primaryDark,
                      fontSize: KslFontSizes.xs,
                      fontWeight: 800,
                      lineHeight: 1.2,
                    }}
                  >
                    {stabilityProgress}%
                  </Typography>
                ) : null}
              </Stack>
            </Stack>

            {showStabilityProgress && (
              <Stack spacing={0.5}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.textSecondary, fontWeight: 600 }}>
                    {stabilityState === "waiting" && t("fsHoldStill")}
                    {stabilityState === "stable" && t("fsStableHold")}
                    {stabilityState === "timeout" && t("fsStabilityTimeout")}
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
              {t("fsCameraCaption")}
            </Typography>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <TipCard label={t("fsTip")} text={tipText} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <MetricCard
            label={t("fsMatchConfidence")}
            value={accuracy != null ? `${displayConfidence}%` : "—"}
            highlight={passed}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <MetricCard
            label={t("fsPredictResult")}
            value={predictedLetter ?? "—"}
            highlight={predictedLetter != null && passed}
          />
        </Grid>
      </Grid>

      <PracticeFeedbackPanel
        title={t("fsCorrectionResult")}
        text={correctionText}
        retryLabel={t("fsRetry")}
        continueLabel={t("fsContinueLesson")}
        passed={passed}
        isSubmitting={isSubmitting}
        isContinuing={isContinuing}
        onRetry={onRetry}
        onContinue={onContinue}
      />
    </Stack>
  );
}
