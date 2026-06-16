"use client";

import { Icon } from "@iconify/react";
import {
  Button,
  ButtonBase,
  Collapse,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import type { FsLesson } from "../types";
import {
  selectCurrentUnit,
  selectResumeLesson,
  useFingerSpellingStore,
  type FsTrackChapter,
  type FsTrackUnit,
} from "../store";
import {
  formatBadgeStep,
  formatChapterBadge,
  formatLessonLabel,
  formatUnitBadge,
  getLessonDisplayLetter,
} from "../utils/chapter";
import {
  resolveLessonStates,
  type LessonDisplayState,
} from "../utils/progress";

type FingerSpellingTrackProps = {
  units: FsTrackUnit[];
};

const stateIcon: Record<LessonDisplayState, string> = {
  done: "solar:lock-unlocked-bold",
  now: "solar:play-circle-bold",
  lock: "solar:lock-keyhole-bold",
};

function getUnitTitle(unit: FsTrackUnit, locale: "kh" | "en"): string {
  return locale === "kh" ? unit.titleKh || unit.title : unit.title;
}

export default function FingerSpellingTrack({
  units,
}: FingerSpellingTrackProps) {
  const { locale, t } = useTranslation();
  const expandedUnitId = useFingerSpellingStore((state) => state.expandedUnitId);
  const toggleUnitExpanded = useFingerSpellingStore(
    (state) => state.toggleUnitExpanded
  );
  const resumeLesson = useFingerSpellingStore(selectResumeLesson);
  const currentUnit = useFingerSpellingStore(selectCurrentUnit);

  const currentUnitTitle = currentUnit
    ? getUnitTitle(currentUnit, locale)
    : t("fsTrackFallbackUnitTitle");
  const currentUnitCompleted = currentUnit?.completedLessonCount ?? 0;
  const currentUnitTotal = currentUnit?.totalLessonCount ?? 0;
  const quizChaptersUnlocked =
    currentUnit?.chapters.filter((chapter) => chapter.isExerciseUnlocked)
      .length ?? 0;
  const quizChaptersTotal = currentUnit?.chapters.length ?? 0;

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
              fontSize: KslFontSizes.xs,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {t("fsTrackEyebrow")}
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
            {t("fsTrackTitle")}
          </Typography>
        </Stack>

        <Button
          component={resumeLesson ? Link : "button"}
          href={
            resumeLesson ? ROUTES.fingerSpelling.lesson(resumeLesson.id) : undefined
          }
          disabled={!resumeLesson}
          variant="outlined"
          sx={{
            borderColor: KslColors.border,
            borderRadius: 3,
            color: KslColors.primaryDark,
            fontWeight: 700,
            px: 2.5,
            py: 1.25,
          }}
        >
          {t("continueLesson")}
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TrackSummaryCard
            step={formatBadgeStep(currentUnit?.orderIndex ?? 1, locale)}
            title={currentUnitTitle}
            description={t("fsTrackSummaryDescription")}
            completedCount={currentUnitCompleted}
            totalCount={currentUnitTotal}
            countLabel={t("lessons")}
            active
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TrackSummaryCard
            step={formatBadgeStep(2, locale)}
            title={t("fsTrackQuizTitle")}
            description={t("fsTrackQuizDescription")}
            completedCount={quizChaptersUnlocked}
            totalCount={quizChaptersTotal}
            countLabel={t("fsChapter")}
          />
        </Grid>
      </Grid>

      <Stack spacing={1.5}>
        {units.map((unit) => (
          <UnitTrackCard
            key={unit.id}
            unit={unit}
            expanded={unit.isLocked !== true && expandedUnitId === unit.id}
            onToggle={() => {
              if (unit.isLocked === true) return;
              toggleUnitExpanded(unit.id);
            }}
            locale={locale}
            unitLabel={t("fsUnit")}
            chapterLabel={t("fsChapter")}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function TrackSummaryCard({
  step,
  title,
  description,
  completedCount,
  totalCount,
  countLabel,
  active = false,
}: {
  step: string;
  title: string;
  description: string;
  completedCount: number;
  totalCount: number;
  countLabel: string;
  active?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        border: `1px solid ${active ? "rgba(31,159,111,0.35)" : KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        boxShadow: active ? "0 0 0 1px rgba(31,159,111,0.08)" : "none",
        p: { xs: 2.25, md: 3 },
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <NumberBadge>{step}</NumberBadge>
          <Typography
            sx={{
              color: KslColors.textSecondary,
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
              lineHeight: 1.35,
              textAlign: "right",
            }}
          >
            {t("fsTrackProgressSummary", {
              completed: completedCount,
              total: totalCount,
              label: countLabel,
            })}
          </Typography>
        </Stack>

        <Stack spacing={0.75}>
          <Typography
            sx={{
              color: KslColors.textPrimary,
              fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              color: KslColors.textSecondary,
              fontSize: KslFontSizes.sm,
              lineHeight: 1.45,
              maxWidth: 380,
            }}
          >
            {description}
          </Typography>
        </Stack>
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

function UnitTrackCard({
  unit,
  expanded,
  onToggle,
  locale,
  unitLabel,
  chapterLabel,
}: {
  unit: FsTrackUnit;
  expanded: boolean;
  onToggle: () => void;
  locale: "kh" | "en";
  unitLabel: string;
  chapterLabel: string;
}) {
  const locked = unit.isLocked === true;
  const { t } = useTranslation();
  const unitTitle = locale === "kh" ? unit.titleKh || unit.title : unit.title;

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        overflow: "hidden",
        opacity: locked ? 0.62 : 1,
        cursor: locked ? "not-allowed" : "default",
      }}
    >
      <ButtonBase
        component="button"
        type="button"
        disabled={locked}
        aria-disabled={locked}
        onClick={() => {
          if (locked) return;
          onToggle();
        }}
        sx={{
          alignItems: "center",
          bgcolor: expanded ? KslColors.primaryLighter : "background.paper",
          cursor: locked ? "not-allowed" : "pointer",
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          p: { xs: 1.5, md: 2 },
          textAlign: "left",
          width: "100%",
          "&.Mui-disabled": {
            color: "inherit",
            opacity: 1,
            pointerEvents: "auto",
          },
          "&.Mui-disabled, &.Mui-disabled *": {
            cursor: "not-allowed",
          },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", minWidth: 0 }}>
          <NumberBadge>{formatBadgeStep(unit.orderIndex, locale)}</NumberBadge>
          <Typography
            sx={{
              color: KslColors.textPrimary,
              fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            {formatUnitBadge(unit.orderIndex, locale, unitLabel)}: {unitTitle}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            color: KslColors.textSecondary,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              display: { xs: "none", md: "block" },
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
            }}
          >
            {t("fsTrackCurrentUnitProgress", {
              completed: unit.completedLessonCount,
              total: unit.totalLessonCount,
            })}
          </Typography>
          <Stack
            component="span"
            sx={{
              alignItems: "center",
              bgcolor: locked ? "rgba(101,116,110,0.14)" : KslColors.primary,
              borderRadius: "50%",
              color: locked ? KslColors.locked : "#fff",
              height: 34,
              justifyContent: "center",
              width: 34,
            }}
          >
            <Icon
              icon={
                expanded
                  ? "solar:alt-arrow-up-linear"
                  : "solar:alt-arrow-down-linear"
              }
              width={18}
            />
          </Stack>
        </Stack>
      </ButtonBase>

      <Collapse in={expanded} unmountOnExit>
        <Stack spacing={1.5} sx={{ borderTop: `1px solid ${KslColors.border}`, p: 2 }}>
          {unit.chapters.map((chapter) => (
            <ChapterTrackSection
              key={chapter.id}
              chapter={chapter}
              locale={locale}
              chapterLabel={chapterLabel}
            />
          ))}
        </Stack>
      </Collapse>
    </Paper>
  );
}

function ChapterTrackSection({
  chapter,
  locale,
  chapterLabel,
}: {
  chapter: FsTrackChapter;
  locale: "kh" | "en";
  chapterLabel: string;
}) {
  const locked = chapter.isLocked === true;
  const expanded = useFingerSpellingStore((state) =>
    chapter.isLocked !== true && state.expandedChapterIds[chapter.id] === true
  );
  const toggleChapterExpanded = useFingerSpellingStore(
    (state) => state.toggleChapterExpanded
  );
  const lessonStates = useMemo(
    () => resolveLessonStates(chapter.lessons),
    [chapter.lessons]
  );
  const { t } = useTranslation();
  const chapterTitle =
    locale === "kh" ? chapter.titleKh || chapter.title : chapter.title;

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.wordCard + 6}px`,
        overflow: "hidden",
        opacity: locked ? 0.62 : 1,
        cursor: locked ? "not-allowed" : "default",
      }}
    >
      <ButtonBase
        component="button"
        type="button"
        disabled={locked}
        aria-disabled={locked}
        onClick={() => {
          if (locked) return;
          toggleChapterExpanded(chapter.id);
        }}
        sx={{
          alignItems: "center",
          bgcolor: expanded ? KslColors.primaryLight : "background.paper",
          cursor: locked ? "not-allowed" : "pointer",
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          p: { xs: 1.5, md: 2 },
          textAlign: "left",
          width: "100%",
          "&.Mui-disabled": {
            color: "inherit",
            opacity: 1,
            pointerEvents: "auto",
          },
          "&.Mui-disabled, &.Mui-disabled *": {
            cursor: "not-allowed",
          },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          sx={{
            alignItems: { xs: "flex-start", md: "center" },
            flex: 1,
            minWidth: 0,
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography
              sx={{
                color: KslColors.primaryDark,
                fontSize: KslFontSizes.md,
                fontWeight: 700,
                letterSpacing: locale === "kh" ? 0 : "0.06em",
                textTransform: locale === "kh" ? "none" : "uppercase",
              }}
            >
              {formatChapterBadge(chapter.orderIndex, locale, chapterLabel)}:
            </Typography>
            <Typography
              sx={{
                color: KslColors.textPrimary,
                fontSize: KslFontSizes.md,
                fontWeight: 700,
              }}
            >
              {chapterTitle}
            </Typography>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            color: KslColors.textSecondary,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              display: { xs: "none", md: "block" },
              fontSize: KslFontSizes.xs,
              fontWeight: 600,
            }}
          >
            {t("fsChapterLessonsPractice", { count: chapter.lessonCount })}
          </Typography>
          <Stack
            component="span"
            sx={{
              alignItems: "center",
              bgcolor: locked ? "rgba(101,116,110,0.14)" : KslColors.primaryLight,
              borderRadius: "50%",
              color: locked ? KslColors.locked : KslColors.primaryDark,
              height: 34,
              justifyContent: "center",
              width: 34,
            }}
          >
            <Icon
              icon={
                expanded
                  ? "solar:alt-arrow-up-linear"
                  : "solar:alt-arrow-down-linear"
              }
              width={18}
            />
          </Stack>
        </Stack>
      </ButtonBase>

      <Collapse in={expanded} unmountOnExit>
        <Stack spacing={0.75} sx={{ borderTop: `1px solid ${KslColors.border}`, p: 1 }}>
          {chapter.lessons.map((lesson) => (
            <LessonTrackRow
              key={lesson.id}
              lesson={lesson}
              locale={locale}
              state={lessonStates.get(lesson.id) ?? "lock"}
            />
          ))}
        </Stack>
      </Collapse>
    </Paper>
  );
}

function LessonTrackRow({
  lesson,
  locale,
  state,
}: {
  lesson: FsLesson;
  locale: "kh" | "en";
  state: LessonDisplayState;
}) {
  const { t } = useTranslation();
  const title = formatLessonLabel(lesson.orderIndex, locale);
  const subtitle = getLessonDisplayLetter(lesson);
  const unlocked = state !== "lock" && !lesson.isLocked;

  const row = (
    <Paper
      elevation={0}
      sx={{
        alignItems: "center",
        bgcolor: state === "now" ? "#fffbf0" : "background.paper",
        border: `1px solid ${state === "now" ? "rgba(243,184,63,0.55)" : KslColors.border}`,
        borderRadius: `${KslRadii.wordCard + 4}px`,
        display: "flex",
        gap: { xs: 1.25, md: 2 },
        opacity: state === "lock" ? 0.65 : 1,
        px: { xs: 1.25, md: 2 },
        py: 1.25,
        cursor: unlocked ? "pointer" : "not-allowed",
        transform: "translateY(0)",
        transition:
          "border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease",
        ...(unlocked && {
          "&:hover": {
            bgcolor: KslColors.primaryLighter,
            borderColor: KslColors.primary,
            boxShadow: KslShadows.card,
            transform: "translateY(-3px)",
          },
        }),
      }}
    >
      <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            color: KslColors.textPrimary,
            fontSize: KslFontSizes.md,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          {title}:
        </Typography>
        <Typography
          sx={{
            color: KslColors.textPrimary,
            fontSize: KslFontSizes.md,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          {subtitle}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={1.25}
        sx={{ alignItems: "center", flexShrink: 0 }}
      >
        {state === "done" ? (
          <Stack
            component="span"
            direction="row"
            spacing={1}
            sx={{ alignItems: "center" }}
          >
            <Typography
              sx={{
                color: KslColors.success,
                fontSize: KslFontSizes.sm,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {t("fsCompleted")}
            </Typography>
            <Stack
              component="span"
              sx={{
                alignItems: "center",
                bgcolor: KslColors.success,
                borderRadius: "50%",
                color: "#fff",
                height: 34,
                justifyContent: "center",
                width: 34,
              }}
            >
              <Icon icon="mdi:check-bold" width={18} />
            </Stack>
          </Stack>
        ) : (
          <Stack
            component="span"
            sx={{
              alignItems: "center",
              bgcolor:
                state === "now"
                  ? "rgba(243,184,63,0.18)"
                  : "rgba(101,116,110,0.14)",
              borderRadius: "50%",
              color: state === "now" ? KslColors.inProgress : KslColors.locked,
              height: 34,
              justifyContent: "center",
              width: 34,
            }}
          >
            <Icon icon={stateIcon[state]} width={18} />
          </Stack>
        )}
      </Stack>
    </Paper>
  );

  if (!unlocked) return row;

  return (
    <Link
      href={ROUTES.fingerSpelling.lesson(lesson.id)}
      style={{ color: "inherit", textDecoration: "none" }}
    >
      {row}
    </Link>
  );
}
