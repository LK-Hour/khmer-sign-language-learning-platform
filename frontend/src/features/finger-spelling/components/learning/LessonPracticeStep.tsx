"use client";

import {
  Alert,
  Button,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState, type RefObject } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import {
  KslColors,
  KslFontSizes,
  KslRadii,
  KslShadows,
} from "@/theme/theme";
import type {
  RawHandDetection,
  StabilityState,
} from "@/features/finger-spelling/ml/useHandLandmarker";
import LessonWebcamPanel from "./LessonWebcamPanel";
import SignImageCard from "./SignImageCard";

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
  isLandmarkerReady?: boolean;
  recError?: string | null;
  videoRef?: RefObject<HTMLVideoElement | null>;
  detectLandmarks: (video: HTMLVideoElement) => RawHandDetection;
  onDetection?: (detection: RawHandDetection) => void;
  stabilityState: StabilityState;
  stabilityProgress: number;
  onRetry: () => void;
  onContinue: () => void;
};

function TipCard({ label, text }: { label: string; text: string }) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 2,
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        bgcolor: "#fbfdfc",
      }}
    >
      <Typography
        sx={{
          color: KslColors.muted,
          fontSize: 13,
          fontWeight: 600,
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: KslColors.textPrimary,
          fontSize: "14px",
          lineHeight: 1.55,
        }}
      >
        {text}
      </Typography>
    </Paper>
  );
}

function animateScore(
  setter: (v: number) => void,
  target: number,
  duration = 420
): () => void {
  const startedAt = performance.now();
  let frame = 0;

  function tick(now: number) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    setter(Math.round(target * eased));
    if (progress < 1) frame = requestAnimationFrame(tick);
  }

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

function MetricCard({
  label,
  value,
  highlight = false,
  khmerValue = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  khmerValue?: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 2,
        border: `1px solid ${highlight ? "rgba(31,159,111,0.28)" : KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        bgcolor: highlight ? KslColors.primaryLight : "#fbfdfc",
      }}
    >
      <Typography
        component="p"
        sx={{
          m: 0,
          color: KslColors.primaryDark,
          fontFamily: khmerValue ? fontFamilies.khmer : fontFamilies.english,
          fontSize: khmerValue ? { xs: 36, md: 42 } : 30,
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          mt: 0.75,
          color: KslColors.muted,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>
    </Paper>
  );
}

export default function LessonPracticeStep({
  letter,
  imageUrl,
  tip,
  accuracy,
  predictedLetter,
  passThreshold,
  cameraResetKey,
  isSubmitting = false,
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
  const [displayConfidence, setDisplayConfidence] = useState(0);

  const passed = accuracy != null && accuracy >= passThreshold;

  useEffect(() => {
    if (accuracy == null) return;
    return animateScore(setDisplayConfidence, accuracy);
  }, [accuracy]);

  const correctionText = passed
    ? "Correct. Your thumb placement is strong. Raise the index finger slightly for a cleaner shape."
    : accuracy != null
      ? "Almost there. Adjust your hand angle and keep the palm closer to the sample."
      : t("fsHoldStill");
  const tipText =
    tip?.trim() ||
    "Use Right hand for better Accuaracy. Match your hand shape to the sample. Keep fingers visible and compare it with the camera preview.";
  const stabilityLabel = !isLandmarkerReady
    ? t("fsLandmarkerLoading")
    : isSubmitting
      ? "Evaluating..."
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
                color: KslColors.muted,
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
                    fontSize: 13,
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
                      fontSize: 13,
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
                  <Typography sx={{ fontSize: 14, color: KslColors.muted, fontWeight: 600 }}>
                    {stabilityState === "waiting" && t("fsHoldStill")}
                    {stabilityState === "stable" && t("fsStableHold")}
                    {stabilityState === "timeout" && t("fsStabilityTimeout")}
                  </Typography>
                  {stabilityState === "waiting" && (
                    <Typography sx={{ fontSize: 14, color: KslColors.muted }}>
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
                      bgcolor: stabilityState === "stable" ? KslColors.primary : KslColors.muted,
                      borderRadius: 3,
                    },
                  }}
                />
              </Stack>
            )}

            <Typography
              sx={{
                color: KslColors.muted,
                fontSize: 14,
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

      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          p: 2,
          borderRadius: `${KslRadii.signImage}px`,
          bgcolor: "#f5faf7",
        }}
      >
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Typography
            component="h4"
            sx={{
              m: 0,
              fontSize: KslFontSizes.lg,
              fontWeight: 600,
              color: KslColors.textPrimary,
            }}
          >
            {t("fsCorrectionResult")}
          </Typography>
          <Typography
            sx={{
              color: KslColors.muted,
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            {correctionText}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            onClick={onRetry}
            disabled={isSubmitting}
            sx={{
              minWidth: 110,
              minHeight: 46,
              borderRadius: `${KslRadii.button}px`,
              fontSize: KslFontSizes.md,
              fontWeight: 700,
            }}
          >
            {t("fsRetry")}
          </Button>
          <Button
            variant="contained"
            onClick={onContinue}
            disabled={!passed}
            sx={{
              minWidth: 150,
              minHeight: 46,
              borderRadius: `${KslRadii.button}px`,
              fontSize: KslFontSizes.md,
              fontWeight: 700,
              boxShadow: passed ? KslShadows.card : "none",
              bgcolor: passed ? KslColors.primary : KslColors.disabled,
              "&:hover": {
                bgcolor: passed ? KslColors.primaryDark : KslColors.disabled,
              },
            }}
          >
            {t("fsContinueLesson")}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
