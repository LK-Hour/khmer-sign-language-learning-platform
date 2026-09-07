"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import { fetchWdUnits } from "../../api/curriculum";
import type { WdUnit } from "../../types";
import { formatBadgeStep, formatUnitBadge } from "../../utils/chapter";
import { WordDetectionTrackSkeleton } from "../WordDetectionPageLoading";

function getUnitTitle(unit: WdUnit, locale: "kh" | "en"): string {
  return locale === "kh" ? unit?.titleKh || unit?.title : unit?.title;
}

export default function WordDetectionExerciseListContainer() {
  const { locale, t } = useTranslation();
  const [units, setUnits] = useState<WdUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUnits = useCallback(async () => {
    const fetched = await fetchWdUnits();
    setUnits([...fetched].sort((a, b) => a.orderIndex - b.orderIndex));
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadUnits().finally(() => setLoading(false));
  }, [loadUnits]);

  const exerciseUnitsUnlocked = units.filter((unit) => unit.isExerciseUnlocked).length;
  const exerciseUnitsTotal = units.length;

  if (loading) {
    return <WordDetectionTrackSkeleton embedded />;
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
        <Stack spacing={1.5}>
          <Typography
            sx={{
              color: KslColors.primaryDark,
              fontFamily: fontFamilies.english,
              fontSize: KslFontSizes.md,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {t("WORD_DETECTION.TRACK.EYEBROW")}
          </Typography>
          <Typography
            component="h1"
            sx={{
              color: KslColors.textPrimary,
              fontFamily: fontFamilies.english,
              fontSize: { xs: 30, md: 42 },
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            {t("WORD_DETECTION.EXERCISE_LIST.EXERCISE_LABEL")}
          </Typography>
        </Stack>

        <Button
          component={Link}
          href={`/${locale}${ROUTES.words.root}`}
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
          {t("WORD_DETECTION.EXERCISE_LIST.BACK")}
        </Button>
      </Stack>

      <ExerciseSummaryCard
        unlockedCount={exerciseUnitsUnlocked}
        totalCount={exerciseUnitsTotal}
      />

      <Stack spacing={1.5}>
        {units.map((unit) => (
          <ExerciseUnitCard
            key={unit.id}
            unit={unit}
            locale={locale}
            unitLabel={t("WORD_DETECTION.LABELS.UNIT")}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function ExerciseSummaryCard({
  unlockedCount,
  totalCount,
}: {
  unlockedCount: number;
  totalCount: number;
}) {
  const { t, locale } = useTranslation();

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid rgba(31,159,111,0.35)",
        borderRadius: `${KslRadii.card}px`,
        boxShadow: "0 0 0 1px rgba(31,159,111,0.08)",
        p: { xs: 2.25, md: 3 },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "flex-start", md: "flex-start" },
          justifyContent: "space-between",
        }}
      >
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              color: KslColors.textPrimary,
              fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            {t("WORD_DETECTION.EXERCISE_LIST.EXERCISE_LABEL")}
          </Typography>
          <Typography
            sx={{
              color: KslColors.textSecondary,
              fontSize: KslFontSizes.sm,
              lineHeight: 1.45,
              maxWidth: 760,
            }}
          >
            {t("WORD_DETECTION.EXERCISE_LIST.DESCRIPTION")}
          </Typography>
        </Stack>

        <Typography
          sx={{
            color: KslColors.textSecondary,
            fontSize: KslFontSizes.sm,
            fontWeight: 700,
            lineHeight: 1.35,
            textAlign: { xs: "left", md: "right" },
            flexShrink: 0,
          }}
        >
          {locale === "kh"
            ? `${unlockedCount}/${totalCount} ${t("WORD_DETECTION.LABELS.UNIT")} ${t("WORD_DETECTION.EXERCISE_LIST.UNLOCKED")}`
            : `${unlockedCount} ${t("PHRASES.OF")} ${totalCount} ${t("WORD_DETECTION.LABELS.UNIT")} ${t("WORD_DETECTION.EXERCISE_LIST.UNLOCKED")}`}
        </Typography>
      </Stack>
    </Paper>
  );
}

function NumberBadge({ children }: { children: React.ReactNode }) {
  return (
    <Stack
      component="span"
      sx={{
        alignItems: "center",
        bgcolor: KslColors.primaryLighter,
        borderRadius: 2.5,
        color: KslColors.primaryDark,
        flexShrink: 0,
        fontFamily: fontFamilies.english,
        fontSize: KslFontSizes.lg,
        fontWeight: 700,
        height: 42,
        justifyContent: "center",
        width: 42,
      }}
    >
      {children}
    </Stack>
  );
}

function ExerciseUnitCard({
  unit,
  locale,
  unitLabel,
}: {
  unit: WdUnit;
  locale: "kh" | "en";
  unitLabel: string;
}) {
  const { t } = useTranslation();
  const isUnlocked = unit.isExerciseUnlocked ?? false;
  const unitTitle = getUnitTitle(unit, locale);

  const status = isUnlocked
    ? {
        icon: "solar:play-bold",
        iconBg: "rgba(243,184,63,0.18)",
        iconInnerBg: KslColors.inProgress,
        iconColor: "#fff",
        rowBg: "#fffbf0",
        rowBorder: "rgba(243,184,63,0.55)",
      }
    : {
        icon: "solar:lock-keyhole-bold",
        iconBg: "rgba(101,116,110,0.14)",
        iconInnerBg: undefined,
        iconColor: KslColors.locked,
        rowBg: "background.paper",
        rowBorder: KslColors.border,
      };

  const card = (
    <Paper
      elevation={0}
      sx={{
        alignItems: "center",
        bgcolor: status.rowBg,
        border: `1px solid ${status.rowBorder}`,
        borderRadius: `${KslRadii.card}px`,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 1.5, md: 2 },
        opacity: isUnlocked ? 1 : 0.65,
        p: { xs: 2, md: 2.5 },
        cursor: isUnlocked ? "pointer" : "not-allowed",
        transform: "translateY(0)",
        transition:
          "border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease",
        ...(isUnlocked && {
          "&:hover": {
            bgcolor: KslColors.primaryLighter,
            borderColor: KslColors.primary,
            boxShadow: KslShadows.card,
            transform: "translateY(-3px)",
          },
        }),
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
        <NumberBadge>{formatBadgeStep(unit?.orderIndex, locale)}</NumberBadge>
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: KslColors.textPrimary,
              fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            {formatUnitBadge(unit?.orderIndex, locale, unitLabel)}: {unitTitle}
          </Typography>
          <Typography
            sx={{
              color: KslColors.textSecondary,
              fontSize: KslFontSizes.sm,
              fontWeight: 600,
              lineHeight: 1.35,
            }}
          >
            {isUnlocked
              ? t("WORD_DETECTION.EXERCISE_LIST.READY_HINT")
              : t("WORD_DETECTION.EXERCISE_LIST.LOCKED_HINT")
                  .replace("{{completed}}", String(unit.completedLessonCount ?? 0))
                  .replace("{{total}}", String(unit.totalLessonCount ?? 0))}
          </Typography>
        </Stack>
      </Stack>

      <Stack
        component="span"
        sx={{
          alignItems: "center",
          bgcolor: status.iconBg,
          borderRadius: "50%",
          flexShrink: 0,
          height: 34,
          justifyContent: "center",
          width: 34,
        }}
      >
        {status.iconInnerBg ? (
          <Stack
            component="span"
            sx={{
              alignItems: "center",
              bgcolor: status.iconInnerBg,
              borderRadius: "50%",
              color: status.iconColor,
              height: 22,
              justifyContent: "center",
              width: 22,
            }}
          >
            <Icon icon={status.icon} width={14} />
          </Stack>
        ) : (
          <Stack
            component="span"
            sx={{ alignItems: "center", color: status.iconColor, justifyContent: "center" }}
          >
            <Icon icon={status.icon} width={18} />
          </Stack>
        )}
      </Stack>
    </Paper>
  );

  if (!isUnlocked) {
    return card;
  }

  return (
    <Link
      href={`/${locale}${ROUTES.words.exercise(unit.id)}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {card}
    </Link>
  );
}
