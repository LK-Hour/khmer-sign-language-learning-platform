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

import type { WdLesson } from "../types";
import {
  selectCurrentUnit,
  selectResumeLesson,
  useWordDetectionStore,
  type WdTrackChapter,
  type WdTrackUnit,
} from "../store";
import {
  formatBadgeStep,
  formatChapterBadge,
  formatLessonLabel,
  formatUnitBadge,
  getPracticeDisplayRange,
} from "../utils/chapter";
import {
  resolveLessonStates,
  resolvePracticeState,
  type LessonDisplayState,
} from "../utils/progress";

type WordDetectionTrackProps = {
  units: WdTrackUnit[];
};

const lessonStatus: Record<
  LessonDisplayState,
  {
    icon: string;
    iconBg: string;
    iconInnerBg?: string;
    iconColor: string;
    showCompletedLabel: boolean;
    showContinueLabel: boolean;
    rowBg: string;
    rowBorder: string;
    rowOpacity: number;
  }
> = {
  done: {
    icon: "mdi:check-bold",
    iconBg: "rgba(31,159,111,0.18)",
    iconInnerBg: KslColors.success,
    iconColor: "#fff",
    showCompletedLabel: true,
    showContinueLabel: false,
    rowBg: "background.paper",
    rowBorder: KslColors.border,
    rowOpacity: 1,
  },
  now: {
    icon: "solar:play-bold",
    iconBg: "rgba(243,184,63,0.18)",
    iconInnerBg: KslColors.inProgress,
    iconColor: "#fff",
    showCompletedLabel: false,
    showContinueLabel: true,
    rowBg: "#fffbf0",
    rowBorder: "rgba(243,184,63,0.55)",
    rowOpacity: 1,
  },
  lock: {
    icon: "solar:lock-keyhole-bold",
    iconBg: "rgba(101,116,110,0.14)",
    iconColor: KslColors.locked,
    showCompletedLabel: false,
    showContinueLabel: false,
    rowBg: "background.paper",
    rowBorder: KslColors.border,
    rowOpacity: 0.65,
  },
};

function getUnitTitle(unit: WdTrackUnit, locale: "kh" | "en"): string {
  return locale === "kh" ? unit?.titleKh || unit?.title : unit?.title;
}

export default function WordDetectionTrack({ units }: WordDetectionTrackProps) {
  const { locale, t } = useTranslation();
  const expandedUnitId = useWordDetectionStore((s) => s.expandedUnitId);
  const toggleUnitExpanded = useWordDetectionStore((s) => s.toggleUnitExpanded);
  const resumeLesson = useWordDetectionStore(selectResumeLesson);
  const currentUnit = useWordDetectionStore(selectCurrentUnit);

  const currentUnitTitle = currentUnit
    ? getUnitTitle(currentUnit as WdTrackUnit, locale)
    : t("WORD_DETECTION.TRACK.FALLBACK_UNIT_TITLE");
  const currentUnitCompleted = currentUnit?.completedLessonCount ?? 0;
  const currentUnitTotal = currentUnit?.totalLessonCount ?? 0;

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
            {t("WORD_DETECTION.TRACK.TITLE")}
          </Typography>
        </Stack>

        <Button
          component={resumeLesson ? Link : "button"}
          href={
            resumeLesson
              ? ROUTES.words.lesson(resumeLesson?.id)
              : undefined
          }
          disabled={!resumeLesson}
          variant="outlined"
          sx={{
            borderColor: KslColors.border,
            borderRadius: `${KslRadii.button}px`,
            color: KslColors.primaryDark,
            fontWeight: 700,
            px: 2.5,
            py: 1.25,
          }}
        >
          {t("BUTTON.CONTINUE_LESSON")}
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TrackSummaryCard
            step={formatBadgeStep(currentUnit?.orderIndex ?? 1, locale)}
            title={`${t("PHRASES.LEARN_ABOUT_PREFIX")} ${currentUnitTitle}`}
            description={t("WORD_DETECTION.TRACK.SUMMARY_DESCRIPTION")}
            completedCount={currentUnitCompleted}
            totalCount={currentUnitTotal}
            countLabel={t("LABELS.LESSONS")}
            active
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TrackSummaryCard
            step={formatBadgeStep(2, locale)}
            title={t("WORD_DETECTION.TRACK.QUIZ_TITLE")}
            description={t("WORD_DETECTION.TRACK.QUIZ_DESCRIPTION")}
            completedCount={0}
            totalCount={units.reduce((s, u) => s + u?.chapterCount, 0)}
            countLabel={t("WORD_DETECTION.LABELS.CHAPTER")}
          />
        </Grid>
      </Grid>

      <Stack spacing={1.5}>
        {units?.map((unit) => (
          <UnitTrackCard
            key={unit?.id}
            unit={unit}
            expanded={unit?.isLocked !== true && expandedUnitId === unit?.id}
            onToggle={() => {
              if (unit?.isLocked === true) return;
              toggleUnitExpanded(unit?.id);
            }}
            locale={locale}
            unitLabel={t("WORD_DETECTION.LABELS.UNIT")}
            chapterLabel={t("WORD_DETECTION.LABELS.CHAPTER")}
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
  const { t, locale } = useTranslation();

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
          sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
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
            {locale === "kh"
              ? `${t("PHRASES.COMPLETED")} ${completedCount}/${totalCount} ${countLabel}`
              : `${completedCount} ${t("PHRASES.OF")} ${totalCount} ${countLabel} ${t("PHRASES.COMPLETED")}`}
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
  unit: WdTrackUnit;
  expanded: boolean;
  onToggle: () => void;
  locale: "kh" | "en";
  unitLabel: string;
  chapterLabel: string;
}) {
  const locked = unit?.isLocked === true;
  const { t } = useTranslation();
  const unitTitle = locale === "kh" ? unit?.titleKh || unit?.title : unit?.title;

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
          "&.Mui-disabled": { color: "inherit", opacity: 1, pointerEvents: "auto" },
          "&.Mui-disabled, &.Mui-disabled *": { cursor: "not-allowed" },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", minWidth: 0 }}>
          <NumberBadge>{formatBadgeStep(unit?.orderIndex, locale)}</NumberBadge>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            {(locale === "kh" ? unit?.categoryKh : unit?.category) ? (
              <Typography
                sx={{
                  color: KslColors.primaryDark,
                  fontSize: KslFontSizes.xs,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {locale === "kh" ? unit?.categoryKh : unit?.category}
              </Typography>
            ) : null}
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
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", color: KslColors.textSecondary, flexShrink: 0 }}
        >
          <Typography
            sx={{ display: { xs: "none", md: "block" }, fontSize: KslFontSizes.sm, fontWeight: 700 }}
          >
            {locale === "kh"
              ? `${t("PHRASES.COMPLETED")} ${unit?.completedLessonCount ?? 0}/${unit?.totalLessonCount ?? 0} ${t("PHRASES.LESSONS")}`
              : `${unit?.completedLessonCount ?? 0} ${t("PHRASES.OF")} ${unit?.totalLessonCount ?? 0} ${t("PHRASES.LESSONS")} ${t("PHRASES.COMPLETED")}`}
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
              icon={expanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
              width={18}
            />
          </Stack>
        </Stack>
      </ButtonBase>

      <Collapse in={expanded} unmountOnExit>
        <Stack spacing={1.5} sx={{ borderTop: `1px solid ${KslColors.border}`, p: 2 }}>
          {unit?.chapters?.map((chapter) => (
            <ChapterTrackSection
              key={chapter?.id}
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
  chapter: WdTrackChapter;
  locale: "kh" | "en";
  chapterLabel: string;
}) {
  const locked = chapter?.isLocked === true;
  const expanded = useWordDetectionStore(
    (s) => chapter?.isLocked !== true && s.expandedChapterIds[chapter?.id] === true
  );
  const toggleChapterExpanded = useWordDetectionStore((s) => s.toggleChapterExpanded);
  const lessonStates = useMemo(
    () => resolveLessonStates(chapter?.lessons),
    [chapter?.lessons]
  );
  const { t } = useTranslation();
  const chapterTitle = locale === "kh" ? chapter?.titleKh || chapter?.title : chapter?.title;

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
          toggleChapterExpanded(chapter?.id);
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
          "&.Mui-disabled": { color: "inherit", opacity: 1, pointerEvents: "auto" },
          "&.Mui-disabled, &.Mui-disabled *": { cursor: "not-allowed" },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          sx={{ alignItems: { xs: "flex-start", md: "center" }, flex: 1, minWidth: 0 }}
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
              {formatChapterBadge(chapter?.orderIndex, locale, chapterLabel)}:
            </Typography>
            <Typography
              sx={{ color: KslColors.textPrimary, fontSize: KslFontSizes.md, fontWeight: 700 }}
            >
              {chapterTitle}
            </Typography>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", color: KslColors.textSecondary, flexShrink: 0 }}
        >
          <Typography
            sx={{ display: { xs: "none", md: "block" }, fontSize: KslFontSizes.xs, fontWeight: 600 }}
          >
            {`${chapter?.lessonCount ?? 0} ${t("PHRASES.LESSONS")}`}
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
              icon={expanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
              width={18}
            />
          </Stack>
        </Stack>
      </ButtonBase>

      <Collapse in={expanded} unmountOnExit>
        <Stack spacing={0.75} sx={{ borderTop: `1px solid ${KslColors.border}`, p: 1 }}>
          {chapter?.lessons?.map((lesson) => (
            <LessonTrackRow
              key={lesson?.id}
              lesson={lesson}
              locale={locale}
              state={lessonStates.get(lesson?.id) ?? "lock"}
            />
          ))}
          <PracticeTrackRow chapter={chapter} locale={locale} />
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
  lesson: WdLesson;
  locale: "kh" | "en";
  state: LessonDisplayState;
}) {
  const { t } = useTranslation();
  const title = formatLessonLabel(lesson?.orderIndex, locale);
  const status = lessonStatus[state];
  const unlocked = state !== "lock" && !lesson?.isLocked;

  const row = (
    <Paper
      elevation={0}
      sx={{
        bgcolor: status.rowBg,
        border: `1px solid ${status.rowBorder}`,
        borderRadius: `${KslRadii.wordCard + 4}px`,
        overflow: "hidden",
        opacity: status.rowOpacity,
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
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", px: { xs: 1.25, md: 2 }, py: 1.25 }}
      >
        {/* Left: lesson number + word label */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", flex: 1, minWidth: 0 }}
        >
          <Typography
            sx={{
              color: KslColors.textSecondary,
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
              lineHeight: 1.25,
              whiteSpace: "nowrap",
            }}
          >
            {title}:
          </Typography>
          <Typography
            sx={{
              color: KslColors.textPrimary,
              fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },
              fontWeight: 700,
              lineHeight: 1.2,
              minWidth: 0,
            }}
          >
            {lesson?.word}
          </Typography>
        </Stack>

        {/* Right: completed label + status icon */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
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
              {t("WORD_DETECTION.TRACK.CONTINUE")}
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
                sx={{
                  alignItems: "center",
                  color: status.iconColor,
                  justifyContent: "center",
                }}
              >
                <Icon icon={status.icon} width={18} />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );

  if (!unlocked) return row;

  return (
    <Link href={ROUTES.words.lesson(lesson?.id)} style={{ color: "inherit", textDecoration: "none" }}>
      {row}
    </Link>
  );
}

function PracticeTrackRow({
  chapter,
  locale,
}: {
  chapter: WdTrackChapter;
  locale: "kh" | "en";
}) {
  const { t } = useTranslation();
  const state = resolvePracticeState(chapter);
  const status = lessonStatus[state];
  const unlocked = state !== "lock";
  const title =
    locale === "kh"
      ? t("WORD_DETECTION.PRACTICE.CARD_LABEL_KH")
      : t("WORD_DETECTION.PRACTICE.CARD_LABEL");
  const subtitle = getPracticeDisplayRange(chapter?.lessons ?? []);

  const row = (
    <Paper
      elevation={0}
      sx={{
        alignItems: "center",
        bgcolor: status.rowBg,
        border: `1px solid ${status.rowBorder}`,
        borderRadius: `${KslRadii.wordCard + 4}px`,
        display: "flex",
        gap: { xs: 1.25, md: 2 },
        opacity: status.rowOpacity,
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
            fontFamily: fontFamilies.khmer,
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
        <Stack
          component="span"
          direction="row"
          spacing={1}
          sx={{ alignItems: "center" }}
        >
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
          {state === "now" ? (
            <Typography
              sx={{
                color: KslColors.inProgress,
                fontSize: KslFontSizes.sm,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {t("WORD_DETECTION.PRACTICE.CARD_ACTION")}
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
                sx={{
                  alignItems: "center",
                  color: status.iconColor,
                  justifyContent: "center",
                }}
              >
                <Icon icon={status.icon} width={18} />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );

  if (!unlocked) return row;

  return (
    <Link
      href={`/${locale}${ROUTES.words.practice(chapter?.id)}`}
      style={{ color: "inherit", textDecoration: "none" }}
    >
      {row}
    </Link>
  );
}
