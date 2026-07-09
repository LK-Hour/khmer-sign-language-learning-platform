"use client";

import { Button, Grid, Paper, Stack, Typography } from "@mui/material";
import { type RefObject, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import WdCameraPanel from "./WordDetectionCameraPanel";
import WdWordCard from "./WordDetectionWordCard";

const VISUAL_FRAME_SX = {
  position: "relative" as const,
  width: "100%",
  height: { xs: 240, sm: 360, md: 460 },
  flexShrink: 0,
};

type WordDetectionLessonPracticeStepProps = {
  word: string;
  videoUrl?: string | null;
  tip?: string | null;
  locale: string;
  nextLessonId?: number;
  orderIndex: number;
  lessonStep: string;
  predictedLabel?: string | null;
  predictedConfidence?: number | null;
  displayLabel?: string | null;
  displayConfidence?: number | null;
  continueEnabled?: boolean;
  retryWaiting?: boolean;
  liveLabel?: string | null;
  liveConfidence?: number;
  liveLabelMatches?: boolean | null;
  predictorReady?: boolean;
  recError?: string | null;
  isContinuing?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
  onContinue: () => void | Promise<void>;
  videoRef?: RefObject<HTMLVideoElement | null>;
  detectLandmarks: Parameters<typeof WdCameraPanel>[0]["detectLandmarks"];
  isLandmarkerReady: boolean;
  onDetection?: Parameters<typeof WdCameraPanel>[0]["onDetection"];
  onRawStreamReady?: Parameters<typeof WdCameraPanel>[0]["onRawStreamReady"];
};

export default function WdLessonPracticeStep({
  word,
  videoUrl,
  tip,
  nextLessonId,
  predictedLabel,
  displayLabel = null,
  displayConfidence = null,
  continueEnabled = false,
  retryWaiting = false,
  liveLabel,
  liveConfidence = 0,
  liveLabelMatches = null,
  predictorReady = false,
  recError = null,
  isContinuing = false,
  showRetryButton = false,
  onRetry,
  onContinue,
  videoRef,
  detectLandmarks,
  isLandmarkerReady,
  onDetection,
  onRawStreamReady,
}: WordDetectionLessonPracticeStepProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const tipText = tip?.trim() || t("WORD_DETECTION.LESSON.DEFAULT_TIP");
  const sampleVideoUrl = videoUrl?.trim() ?? "";
  const targetWord = word.trim();
  const finalLabel = predictedLabel?.trim() || null;
  const showLivePrediction =
    !finalLabel && predictorReady && !!liveLabel && liveLabelMatches !== null;
  const liveIsNoAction = liveLabel === "No Action";
  const liveDisplayLabel = liveLabelMatches
    ? targetWord
    : liveIsNoAction
      ? "No Action"
      : t("PREDICTION.ANALYZING");
  const liveDisplayConfidence = liveLabelMatches ? Math.round(liveConfidence) : 0;
  const displayedLabel = displayLabel ?? (showLivePrediction ? liveDisplayLabel : null);
  const displayedConfidence = showLivePrediction
    ? liveDisplayConfidence
    : displayConfidence;
  const predictionPassed = Boolean(continueEnabled);
  const isRetryDisabled = Boolean(isContinuing || retryWaiting);
  const isContinueLoading = Boolean(isContinuing);
  const isContinueDisabled = mounted ? Boolean(!predictionPassed || isContinuing) : false;
  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {recError ? (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            border: `1px solid ${KslColors.warning}`,
            borderRadius: `${KslRadii.card}px`,
            bgcolor: "#fff5f4",
          }}
        >
          <Typography sx={{ color: KslColors.warning, fontSize: KslFontSizes.sm }}>
            {recError}
          </Typography>
        </Paper>
      ) : null}

      {/* ── Two-panel visual row ─────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={1}>
            <Stack sx={VISUAL_FRAME_SX}>
              <WdWordCard videoUrl={sampleVideoUrl} />
            </Stack>
            <Typography
              sx={{
                color: KslColors.textSecondary,
                fontSize: KslFontSizes.sm,
                lineHeight: 1.55,
              }}
            >
              {t("WORD_DETECTION.LESSON.SAMPLE_CAPTION")}
            </Typography>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={1}>
            <Stack sx={VISUAL_FRAME_SX}>
              <WdCameraPanel
                videoRef={videoRef}
                detectLandmarks={detectLandmarks}
                isLandmarkerReady={isLandmarkerReady}
                onDetection={onDetection}
                onRawStreamReady={onRawStreamReady}
              />
            </Stack>
            <Typography
              sx={{
                color: KslColors.textSecondary,
                fontSize: KslFontSizes.sm,
                lineHeight: 1.55,
              }}
            >
              {t("WORD_DETECTION.LESSON.CAMERA_CAPTION")}
            </Typography>
          </Stack>
        </Grid>
      </Grid>

      {/* ── Info cards row ───────────────────────────────────────────── */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <TipCard label={t("WORD_DETECTION.LESSON.TIP")} text={tipText} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <MetricCard
            label={t("FINGER_SPELLING.LESSON.MATCH_CONFIDENCE")}
            value={displayedConfidence != null ? `${displayedConfidence}%` : "—"}
            highlight={displayedConfidence != null && displayedConfidence >= 50}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <MetricCard
            label={t("FINGER_SPELLING.LESSON.PREDICT_RESULT")}
            value={displayedLabel ?? "—"}
            khmerValue={!!displayedLabel && displayedLabel !== "No Action"}
            highlight={predictionPassed}
          />
        </Grid>
      </Grid>

      {/* ── Navigation panel ─────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${KslColors.border}`,
          bgcolor: KslColors.primaryLighter,
          borderRadius: `${KslRadii.card}px`,
          p: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Typography
            component="h4"
            sx={{
              color: KslColors.textPrimary,
              fontSize: KslFontSizes.lg,
              fontWeight: 600,
              m: 0,
            }}
          >
            {t("WORD_DETECTION.LESSON.WORD_PRACTICE_SIGN")}
          </Typography>
          <Typography
            sx={{
              color: KslColors.textSecondary,
              fontSize: KslFontSizes.sm,
              lineHeight: 1.55,
            }}
          >
            {t("WORD_DETECTION.LESSON.NAV_DESC")}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexShrink: 0, flexWrap: "wrap" }}>
          {showRetryButton && onRetry ? (
            <Button
              variant="outlined"
              color="inherit"
              onClick={onRetry}
              disabled={isRetryDisabled}
              sx={{
                minWidth: 120,
                minHeight: 46,
                borderRadius: `${KslRadii.button}px`,
                fontSize: KslFontSizes.md,
                fontWeight: 700,
              }}
            >
              {retryWaiting ? t("BUTTON.TRY_AGAIN") : t("WORD_DETECTION.LESSON.RETRY")}
            </Button>
          ) : null}
          <Button
            variant="contained"
            loading={isContinueLoading}
            loadingPosition="center"
            onClick={onContinue}
            disabled={isContinueDisabled}
            sx={{
              minWidth: 150,
              minHeight: 46,
              borderRadius: `${KslRadii.button}px`,
              fontSize: KslFontSizes.md,
              fontWeight: 700,
              boxShadow: predictionPassed ? KslShadows.card : "none",
              bgcolor: predictionPassed ? KslColors.primary : KslColors.disabled,
              color: "#fff",
              "&:hover": {
                bgcolor: predictionPassed ? KslColors.primaryDark : KslColors.disabled,
              },
              "&.MuiButton-loading": {
                color: "transparent",
              },
            }}
          >
            {isContinuing
              ? null
              : nextLessonId != null
                ? t("WORD_DETECTION.LESSON.CONTINUE")
                : t("WORD_DETECTION.LESSON.COMPLETE_CHAPTER")}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

// ─── Local sub-components (mirror PracticeInfoCards) ─────────────────────────

function TipCard({ label, text }: { label: string; text: string }) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 2,
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        bgcolor: KslColors.primaryLighter,
      }}
    >
      <Typography
        sx={{
          color: KslColors.textSecondary,
          fontSize: KslFontSizes.lg,
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

function MetricCard({
  label,
  value,
  khmerValue = false,
  highlight = false,
}: {
  label: string;
  value: string;
  khmerValue?: boolean;
  highlight?: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 2,
        border: `1px solid ${highlight ? KslColors.primary : KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        bgcolor: highlight ? KslColors.primaryLighter : KslColors.primaryLighter,
      }}
    >
      <Typography
        component="p"
        sx={{
          m: 0,
          color: KslColors.primaryDark,
          fontFamily: khmerValue ? "niradei" : fontFamilies.english,
          fontSize: khmerValue
            ? { xs: KslFontSizes["3xl"], md: KslFontSizes["3xl"] }
            : KslFontSizes["2xl"],
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          mt: 0.75,
          color: KslColors.textSecondary,
          fontSize: KslFontSizes.sm,
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>
    </Paper>
  );
}
