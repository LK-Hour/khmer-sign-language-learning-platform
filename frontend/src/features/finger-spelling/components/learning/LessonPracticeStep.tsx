"use client";

import {
  Alert,
  Button,
  Grid,
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
import LessonWebcamPanel from "./LessonWebcamPanel";
import SignImageCard from "./SignImageCard";

const VISUAL_FRAME_SX = {
  position: "relative" as const,
  width: "100%",
  height: { xs: 240, sm: 280, md: 320 },
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
  onRetry: () => void;
  onRec: () => void;
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
          fontWeight: 700,
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: KslColors.textPrimary,
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {text}
      </Typography>
    </Paper>
  );
}

function animateScore(setter: (v: number) => void, target: number, duration = 420) {
  const startedAt = performance.now();
  function tick(now: number) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    setter(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
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
          fontWeight: 800,
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          mt: 0.75,
          color: KslColors.muted,
          fontSize: 13,
          fontWeight: 700,
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
  onRetry,
  onRec,
  onContinue,
}: LessonPracticeStepProps) {
  const { t } = useTranslation();
  const [displayConfidence, setDisplayConfidence] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  const passed = accuracy != null && accuracy >= passThreshold;

  useEffect(() => {
    if (accuracy == null) {
      setDisplayConfidence(0);
      setHasAnimated(false);
      return;
    }
    if (hasAnimated) return;
    setHasAnimated(true);
    animateScore(setDisplayConfidence, accuracy);
  }, [accuracy, hasAnimated]);

  const correctionText = passed
    ? "Correct. Your thumb placement is strong. Raise the index finger slightly for a cleaner shape."
    : accuracy != null
      ? "Almost there. Adjust your hand angle and keep the palm closer to the sample."
      : t("fsPressRecToPractice");

  const tipText =
    tip?.trim() ||
    "Match your hand shape to the sample. Keep fingers visible and hold steady before pressing REC.";

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
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={1}>
            <Stack sx={VISUAL_FRAME_SX}>
              <SignImageCard src={imageUrl} alt={`Sign for ${letter}`} />
            </Stack>
            <Typography
              sx={{
                color: KslColors.muted,
                fontSize: 14,
                lineHeight: 1.55,
              }}
            >
              {t("fsSampleCaption")}
            </Typography>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={1}>
            <Stack sx={VISUAL_FRAME_SX}>
              <LessonWebcamPanel resetKey={cameraResetKey} videoRef={videoRef} />
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "center" }}>
              <Stack
                component="button"
                type="button"
                onClick={accuracy == null ? onRec : onRetry}
                disabled={isSubmitting || !isLandmarkerReady}
                sx={{
                  display: "flex",
                  width: 58,
                  height: 32,
                  border: 0,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  color: KslColors.fail,
                  bgcolor: "white",
                  boxShadow: KslShadows.card,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isSubmitting ? "default" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {t("fsRec")}
              </Stack>
            </Stack>
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
        <Grid size={{ xs: 12, md: 4 }}>
          <TipCard label={t("fsTip")} text={tipText} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            label={t("fsMatchConfidence")}
            value={accuracy != null ? `${displayConfidence}%` : "—"}
            highlight={passed}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
              fontWeight: 700,
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
        <Button
          variant="contained"
          onClick={onContinue}
          disabled={!passed}
          sx={{
            minWidth: 150,
            minHeight: 46,
            borderRadius: `${KslRadii.button}px`,
            fontSize: KslFontSizes.md,
            fontWeight: 800,
            boxShadow: passed ? KslShadows.card : "none",
            bgcolor: passed ? KslColors.primary : KslColors.disabled,
            "&:hover": {
              bgcolor: passed ? KslColors.primaryDark : KslColors.disabled,
            },
          }}
        >
          {t("fsContinueLesson")}
        </Button>
      </Paper>
    </Stack>
  );
}
