"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import { useAuthStore } from "@/store/auth.store";
import { fetchFsTrackUnits } from "../../api/curriculum";
import { useGuestProgressStore } from "../../store/guestProgress.store";
import type { FsUnit } from "../../types";
import { formatBadgeStep, formatUnitBadge } from "../../utils/chapter";
import { applyGuestProgress } from "../../utils/guestProgressMerge";
import { FingerSpellingTrackSkeleton } from "../FingerSpellingPageLoading";

function getUnitTitle(unit: FsUnit, locale: "kh" | "en"): string {
  return locale === "kh" ? unit?.titleKh || unit?.title : unit?.title;
}

function trackUnitToListUnit(unit: ReturnType<typeof applyGuestProgress>[number]): FsUnit {
  const { chapters: _chapters, ...rest } = unit;
  return rest;
}

export default function FingerSpellingExerciseListContainer() {
  const { locale, t } = useTranslation();
  const isGuest = useAuthStore((state) => state.user?.is_guest === true);
  const guestLessons = useGuestProgressStore((state) => state.lessons);
  const guestChapterPractices = useGuestProgressStore(
    (state) => state.completedChapterPractices
  );
  const guestUnitExercises = useGuestProgressStore((state) => state.unitExercises);
  const [units, setUnits] = useState<FsUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUnits = useCallback(async () => {
    const trackUnits = await fetchFsTrackUnits();
    const merged = isGuest ? applyGuestProgress(trackUnits) : trackUnits;
    setUnits(
      merged
        .map(trackUnitToListUnit)
        .sort((a, b) => a.orderIndex - b.orderIndex)
    );
  }, [isGuest]);

  useEffect(() => {
    setLoading(true);
    void loadUnits().finally(() => setLoading(false));
  }, [loadUnits, guestLessons, guestChapterPractices, guestUnitExercises]);

  const exerciseUnitsUnlocked =
    units.filter((unit) => unit.isExerciseUnlocked).length;
  const exerciseUnitsCompleted =
    units.filter((unit) => unit.isExerciseCompleted).length;
  const exerciseUnitsTotal = units.length;

  if (loading) {
    return <FingerSpellingTrackSkeleton embedded />;
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
            {t("FINGER_SPELLING.TRACK.EYEBROW")}
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
            {t("FINGER_SPELLING.TRACK.QUIZ_TITLE")}
          </Typography>
        </Stack>

        <Button
          component={Link}
          href={`/${locale}${ROUTES.fingerSpelling.root}`}
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
          {t("FINGER_SPELLING.EXERCISE_LIST.BACK")}
        </Button>
      </Stack>

      <ExerciseSummaryCard
        completedCount={exerciseUnitsCompleted}
        unlockedCount={exerciseUnitsUnlocked}
        totalCount={exerciseUnitsTotal}
      />

      <Stack spacing={1.5}>
        {units.map((unit) => (
          <ExerciseUnitCard
            key={unit.id}
            unit={unit}
            locale={locale}
            unitLabel={t("FINGER_SPELLING.LABELS.UNIT")}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function ExerciseSummaryCard({
  completedCount,
  unlockedCount,
  totalCount,
}: {
  completedCount: number;
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
            {t("FINGER_SPELLING.TRACK.QUIZ_TITLE")}
          </Typography>
          <Typography
            sx={{
              color: KslColors.textSecondary,
              fontSize: KslFontSizes.sm,
              lineHeight: 1.45,
              maxWidth: 760,
            }}
          >
            {t("FINGER_SPELLING.EXERCISE_LIST.DESCRIPTION")}
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
            ? `${t("PHRASES.COMPLETED")} ${completedCount}/${totalCount} ${t("FINGER_SPELLING.LABELS.UNIT")} · ${unlockedCount} ${t("FINGER_SPELLING.EXERCISE_LIST.UNLOCKED")}`
            : `${completedCount} ${t("PHRASES.OF")} ${totalCount} ${t("FINGER_SPELLING.LABELS.UNIT")} ${t("PHRASES.COMPLETED")} · ${unlockedCount} ${t("FINGER_SPELLING.EXERCISE_LIST.UNLOCKED")}`}
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
  unit: FsUnit;
  locale: "kh" | "en";
  unitLabel: string;
}) {
  const { t } = useTranslation();
  const locked = unit?.isLocked === true;
  const unitTitle = getUnitTitle(unit, locale);
  const isUnlocked = unit.isExerciseUnlocked ?? false;
  const isCompleted = unit.isExerciseCompleted ?? false;
  const lessonsComplete =
    (unit.completedLessonCount ?? 0) >= (unit.totalLessonCount ?? 0);
  const pct =
    isCompleted && unit.maxScore
      ? Math.round(((unit.bestScore ?? 0) / unit.maxScore) * 100)
      : null;

  const status = isCompleted
    ? {
        icon: "mdi:check-bold",
        iconBg: "rgba(31,159,111,0.18)",
        iconInnerBg: KslColors.success,
        iconColor: "#fff",
        rowBg: "background.paper",
        rowBorder: KslColors.border,
        rowOpacity: locked ? 0.62 : 1,
        showCompletedLabel: true,
        showContinueLabel: false,
      }
    : isUnlocked
      ? {
          icon: "solar:play-bold",
          iconBg: "rgba(243,184,63,0.18)",
          iconInnerBg: KslColors.inProgress,
          iconColor: "#fff",
          rowBg: "#fffbf0",
          rowBorder: "rgba(243,184,63,0.55)",
          rowOpacity: locked ? 0.62 : 1,
          showCompletedLabel: false,
          showContinueLabel: true,
        }
      : {
          icon: "solar:lock-keyhole-bold",
          iconBg: "rgba(101,116,110,0.14)",
          iconColor: KslColors.locked,
          rowBg: "background.paper",
          rowBorder: KslColors.border,
          rowOpacity: locked ? 0.62 : 0.65,
          showCompletedLabel: false,
          showContinueLabel: false,
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
        opacity: status.rowOpacity,
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
              ? isCompleted
                ? t("FINGER_SPELLING.EXERCISE_LIST.COMPLETED_HINT")
                : t("FINGER_SPELLING.EXERCISE_LIST.READY_HINT")
              : lessonsComplete
                ? t("FINGER_SPELLING.EXERCISE_LIST.READY")
                : t("FINGER_SPELLING.EXERCISE_LIST.LOCKED_HINT")
                    .replace("{{completed}}", String(unit.completedLessonCount ?? 0))
                    .replace("{{total}}", String(unit.totalLessonCount ?? 0))}
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexShrink: 0 }}>
        {pct !== null ? (
          <Typography
            sx={{
              color: pct >= 60 ? KslColors.success : KslColors.inProgress,
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {t("FINGER_SPELLING.EXERCISE_LIST.BEST_SCORE").replace(
              "{{pct}}",
              String(pct)
            )}
          </Typography>
        ) : null}
        {status.showCompletedLabel ? (
          <Typography
            sx={{
              color: KslColors.success,
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {t("PHRASES.COMPLETED")}
          </Typography>
        ) : null}
        {status.showContinueLabel ? (
          <Typography
            sx={{
              color: KslColors.inProgress,
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {t("FINGER_SPELLING.TRACK.CONTINUE")}
          </Typography>
        ) : null}
        <Stack
          component="span"
          sx={{
            alignItems: "center",
            bgcolor: status.iconBg,
            borderRadius: "50%",
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
      </Stack>
    </Paper>
  );

  if (!isUnlocked) {
    return card;
  }

  return (
    <Link
      href={`/${locale}${ROUTES.fingerSpelling.exercise(unit.id)}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {card}
    </Link>
  );
}
