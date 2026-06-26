"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { Button, Grid, Paper, Stack, Typography } from "@mui/material";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import { resolveWordDetectionVideoUrl } from "@/features/word-detection/data/wordDetectionVideos";
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
  wordEn: string;
  tip?: string | null;
  locale: string;
  nextLessonId?: number;
  orderIndex: number;
  lessonStep: string;
};

export default function WdLessonPracticeStep({
  word,
  wordEn,
  tip,
  locale,
  nextLessonId,
  lessonStep,
}: WordDetectionLessonPracticeStepProps) {
  const { t } = useTranslation();
  const tipText = tip?.trim() || t("WORD_DETECTION.LESSON.DEFAULT_TIP");
  const sampleVideoUrl = resolveWordDetectionVideoUrl(word);

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {/* ── Two-panel visual row ─────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={1}>
            <Stack sx={VISUAL_FRAME_SX}>
              <WdWordCard videoUrl={sampleVideoUrl} wordEn={wordEn} />
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
              <WdCameraPanel />
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
            label={t("WORD_DETECTION.LESSON.STATUS_LABEL")}
            value={t("WORD_DETECTION.LESSON.STATUS_COMING_SOON")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <MetricCard
            label={t("WORD_DETECTION.LESSON.WORD_LABEL")}
            value={word}
            khmerValue
          />
        </Grid>
      </Grid>

      {/* ── Navigation panel ─────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          bgcolor: KslColors.primaryLighter,
          borderRadius: `${KslRadii.signImage}px`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          justifyContent: "space-between",
          p: 2,
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
            {t("WORD_DETECTION.LESSON.NAV_TITLE")}
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
          <Button
            component={Link}
            href={
              nextLessonId != null
                ? `/${locale}${ROUTES.words.lesson(nextLessonId)}`
                : `/${locale}${ROUTES.words.root}`
            }
            variant="contained"
            sx={{
              bgcolor: KslColors.primary,
              borderRadius: `${KslRadii.button}px`,
              boxShadow: KslShadows.card,
              color: "#fff",
              fontWeight: 700,
              minHeight: 46,
              minWidth: 150,
              px: 2.5,
              "&:hover": { bgcolor: KslColors.primaryDark },
            }}
          >
            {nextLessonId != null
              ? t("WORD_DETECTION.LESSON.CONTINUE")
              : t("WORD_DETECTION.LESSON.BACK_TO_TRACK")}
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
          fontSize: KslFontSizes.xs,
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
}: {
  label: string;
  value: string;
  khmerValue?: boolean;
}) {
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
