"use client";

import { Icon } from "@iconify/react";
import { Button, ButtonBase, Collapse, Grid, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";
import type { Locale } from "@/i18n/config";
import { useTranslation } from "@/i18n/useTranslation";
import { formatChapterBadge, formatLessonLabel, formatOrderIndex } from "@/features/shared/trackFormat";
import {
  resolveLessonStates,
  resolvePracticeState,
  type LessonDisplayState,
} from "@/features/shared/trackProgress";
import type { TrackProgressStatus } from "@/features/shared/trackState";
import { useAuthStore } from "@/store/auth.store";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";
import StickyTrackHeader from "./StickyTrackHeader";
import { NumberBadge, TrackSummaryCard } from "./TrackCards";
import TrackEmptyState from "./TrackEmptyState";
import { TrackRow, type TrackRowProps } from "./TrackRow";
import TrackToolbar from "./TrackToolbar";
import { useTrackFilters, type TrackExpansionStore } from "./useTrackFilters";

/** Minimal lesson/chapter/unit shape a learning track can render. */
export type LearningTrackLesson = {
  id: number;
  orderIndex: number;
  isLocked: boolean;
  progressStatus: TrackProgressStatus;
};

export type LearningTrackChapter<L extends LearningTrackLesson> = {
  id: number;
  title: string;
  titleKh: string;
  orderIndex: number;
  lessonCount: number;
  isLocked?: boolean;
  isPracticeUnlocked?: boolean;
  isPracticeComplete?: boolean;
  lessons: L[];
};

export type LearningTrackUnit<C> = {
  id: number;
  title: string;
  titleKh: string;
  category?: string | null;
  categoryKh?: string | null;
  orderIndex: number;
  isLocked?: boolean;
  isExerciseUnlocked?: boolean;
  completedLessonCount: number;
  totalLessonCount: number;
  chapters: C[];
};

/** Already-translated, track-specific strings. */
export type LearningTrackLabels = {
  eyebrow: string;
  title: string;
  searchPlaceholder: string;
  unit: string;
  chapter: string;
  fallbackUnitTitle: string;
  summaryDescription: string;
  exerciseTitle: string;
  exerciseDescription: string;
  /** Action label on the current lesson row. */
  lessonAction: string;
  /** Title of the chapter-practice row (already resolved for the locale). */
  practiceTitle: string;
  /** Action label on an unlocked chapter-practice row. */
  practiceAction: string;
};

type RowConfig<L, C> = {
  lessonVariant: TrackRowProps["variant"];
  getLessonSubtitle: (lesson: L) => string;
  lessonHref: (lessonId: number) => string;
  getPracticeSubtitle: (chapter: C) => string;
  practiceSubtitleSx?: TrackRowProps["subtitleSx"];
  practiceHref: (chapterId: number) => string;
  lessonAction: string;
  practiceTitle: string;
  practiceAction: string;
};

export type LearningTrackProps<
  L extends LearningTrackLesson,
  C extends LearningTrackChapter<L>,
  U extends LearningTrackUnit<C>,
> = {
  units: U[];
  /** Persisted accordion state from the feature store. */
  expansion: TrackExpansionStore;
  resumeLesson?: L;
  currentUnit?: U;
  labels: LearningTrackLabels;
  /** Fields a learner might type to find a lesson. */
  getLessonSearchText: (lesson: L) => (string | null | undefined)[];
  /** Completed-lessons text on a unit header. */
  formatUnitProgress: (completed: number, total: number) => string;
  /** Show the unit category above the unit title. */
  showUnitCategory?: boolean;
  exercisesHref: string;
} & Omit<RowConfig<L, C>, "lessonAction" | "practiceTitle" | "practiceAction">;

function localizedTitle(item: { title: string; titleKh: string }, locale: Locale): string {
  return locale === "kh" ? item?.titleKh || item?.title : item?.title;
}

const HEADER_DISABLED_SX = {
  "&.Mui-disabled": { color: "inherit", opacity: 1, pointerEvents: "auto" },
  "&.Mui-disabled, &.Mui-disabled *": { cursor: "not-allowed" },
};

/**
 * Curriculum track page body shared by finger spelling and word detection:
 * sticky header with search/filters, summary cards and the unit → chapter →
 * lesson accordion. Feature adapters supply strings, routes and row content.
 */
export default function LearningTrack<
  L extends LearningTrackLesson,
  C extends LearningTrackChapter<L>,
  U extends LearningTrackUnit<C>,
>({
  units,
  expansion,
  resumeLesson,
  currentUnit,
  labels,
  getLessonSearchText,
  formatUnitProgress,
  showUnitCategory = false,
  exercisesHref,
  ...rowConfig
}: LearningTrackProps<L, C, U>) {
  const { locale, t } = useTranslation();
  const filters = useTrackFilters<L, C, U>(units ?? [], getLessonSearchText, expansion);
  const rows: RowConfig<L, C> = {
    ...rowConfig,
    lessonAction: labels.lessonAction,
    practiceTitle: labels.practiceTitle,
    practiceAction: labels.practiceAction,
  };

  const currentUnitTitle = currentUnit
    ? localizedTitle(currentUnit, locale)
    : labels.fallbackUnitTitle;
  const currentUnitCompleted = currentUnit?.completedLessonCount ?? 0;
  const currentUnitTotal = currentUnit?.totalLessonCount ?? 0;
  const exerciseUnitsUnlocked = units?.filter((unit) => unit?.isExerciseUnlocked).length ?? 0;
  const exerciseUnitsTotal = units?.length ?? 0;

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }} sx={{ width: "100%" }}>
      <StickyTrackHeader>
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
              {labels.eyebrow}
            </Typography>
            <Typography
              component="h1"
              sx={{
                color: KslColors.textPrimary,
                fontFamily: fontFamilies.english,
                textTransform: "capitalize",
                fontSize: { xs: 26, md: 32 },
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
              }}
            >
              {labels.title}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{ alignItems: { xs: "stretch", sm: "center" }, gap: 1.5, width: { xs: "100%", md: "auto" } }}
          >
            <TrackToolbar
              query={filters.query}
              onQueryChange={filters.setQuery}
              placeholder={labels.searchPlaceholder}
              unitOptions={(units ?? []).map((unit) => ({
                id: unit?.id,
                label: `${formatChapterBadge(unit?.orderIndex, locale, labels.unit)}: ${localizedTitle(unit, locale)}`,
              }))}
              unitIds={filters.unitIds}
              onUnitIdsChange={filters.setUnitIds}
              status={filters.status}
              onStatusChange={filters.setStatus}
              activeFilterCount={filters.activeFilterCount}
              canCollapse={filters.hasOpenSections}
              onCollapseAll={filters.collapseAll}
            />
            <Button
              component={resumeLesson ? Link : "button"}
              href={resumeLesson ? rows.lessonHref(resumeLesson?.id) : undefined}
              disabled={!resumeLesson}
              variant="outlined"
              sx={{
                borderColor: KslColors.border,
                borderRadius: `${KslRadii.button}px`,
                color: KslColors.primaryDark,
                fontWeight: 700,
                height: 44,
                px: 2.5,
                whiteSpace: "nowrap",
              }}
            >
              {t("BUTTON.CONTINUE_LESSON")}
            </Button>
          </Stack>
        </Stack>
      </StickyTrackHeader>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TrackSummaryCard
            step={formatOrderIndex(currentUnit?.orderIndex ?? 1, locale)}
            title={`${t("PHRASES.LEARN_ABOUT_PREFIX")} ${currentUnitTitle}`}
            description={labels.summaryDescription}
            completedCount={currentUnitCompleted}
            totalCount={currentUnitTotal}
            countLabel={t("LABELS.LESSONS")}
            active
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TrackSummaryCard
            step={formatOrderIndex(2, locale)}
            title={labels.exerciseTitle}
            description={labels.exerciseDescription}
            completedCount={exerciseUnitsUnlocked}
            totalCount={exerciseUnitsTotal}
            countLabel={labels.unit}
            ctaHref={exercisesHref}
            ctaLabel={t("BUTTON.TAKE_EXERCISE")}
          />
        </Grid>
      </Grid>

      <Stack spacing={1.5}>
        {filters.visibleUnits.map((unit) => (
          <UnitTrackCard
            key={unit?.id}
            unit={unit}
            expanded={filters.isUnitExpanded(unit)}
            onToggle={() => filters.toggleUnit(unit)}
            filters={filters}
            locale={locale}
            unitLabel={labels.unit}
            chapterLabel={labels.chapter}
            progressLabel={formatUnitProgress(
              unit?.completedLessonCount ?? 0,
              unit?.totalLessonCount ?? 0,
            )}
            showCategory={showUnitCategory}
            rows={rows}
          />
        ))}
        {filters.visibleUnits.length === 0 ? (
          <TrackEmptyState onClear={filters.clearAll} />
        ) : null}
      </Stack>
    </Stack>
  );
}

type ChapterFilters<C> = {
  isChapterVisible: (chapterId: number) => boolean;
  isChapterExpanded: (chapter: C) => boolean;
  toggleChapter: (chapter: C) => void;
  isLessonVisible: (lessonId: number) => boolean;
  isPracticeVisible: (chapterId: number) => boolean;
};

function ExpandIcon({ expanded }: { expanded: boolean }) {
  return (
    <Icon
      icon={expanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
      width={18}
    />
  );
}

function UnitTrackCard<
  L extends LearningTrackLesson,
  C extends LearningTrackChapter<L>,
  U extends LearningTrackUnit<C>,
>({
  unit,
  expanded,
  onToggle,
  filters,
  locale,
  unitLabel,
  chapterLabel,
  progressLabel,
  showCategory,
  rows,
}: {
  unit: U;
  expanded: boolean;
  onToggle: () => void;
  filters: ChapterFilters<C>;
  locale: Locale;
  unitLabel: string;
  chapterLabel: string;
  progressLabel: string;
  showCategory: boolean;
  rows: RowConfig<L, C>;
}) {
  const locked = unit?.isLocked === true;
  const unitTitle = locale === "kh" ? unit?.titleKh || unit?.title : unit?.title;
  const category = locale === "kh" ? unit?.categoryKh : unit?.category;

  const titleText = (
    <Typography
      sx={{
        color: KslColors.textPrimary,
        fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },
        fontWeight: 700,
        lineHeight: 1.25,
      }}
    >
      {formatChapterBadge(unit?.orderIndex, locale, unitLabel)}: {unitTitle}
    </Typography>
  );

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
          ...HEADER_DISABLED_SX,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", minWidth: 0 }}>
          <NumberBadge>{formatOrderIndex(unit?.orderIndex, locale)}</NumberBadge>
          {showCategory ? (
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              {category ? (
                <Typography
                  sx={{
                    color: KslColors.primaryDark,
                    fontSize: KslFontSizes.xs,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {category}
                </Typography>
              ) : null}
              {titleText}
            </Stack>
          ) : (
            titleText
          )}
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", color: KslColors.textSecondary, flexShrink: 0 }}
        >
          <Typography
            sx={{ display: { xs: "none", md: "block" }, fontSize: KslFontSizes.sm, fontWeight: 700 }}
          >
            {progressLabel}
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
            <ExpandIcon expanded={expanded} />
          </Stack>
        </Stack>
      </ButtonBase>

      <Collapse in={expanded} unmountOnExit>
        <Stack spacing={1.5} sx={{ borderTop: `1px solid ${KslColors.border}`, p: 2 }}>
          {unit?.chapters
            ?.filter((chapter) => filters.isChapterVisible(chapter?.id))
            .map((chapter) => (
              <ChapterTrackSection
                key={chapter?.id}
                chapter={chapter}
                expanded={filters.isChapterExpanded(chapter)}
                onToggle={() => filters.toggleChapter(chapter)}
                isLessonVisible={filters.isLessonVisible}
                showPractice={filters.isPracticeVisible(chapter?.id)}
                locale={locale}
                chapterLabel={chapterLabel}
                rows={rows}
              />
            ))}
        </Stack>
      </Collapse>
    </Paper>
  );
}

function ChapterTrackSection<L extends LearningTrackLesson, C extends LearningTrackChapter<L>>({
  chapter,
  expanded,
  onToggle,
  isLessonVisible,
  showPractice,
  locale,
  chapterLabel,
  rows,
}: {
  chapter: C;
  expanded: boolean;
  onToggle: () => void;
  isLessonVisible: (lessonId: number) => boolean;
  showPractice: boolean;
  locale: Locale;
  chapterLabel: string;
  rows: RowConfig<L, C>;
}) {
  const locked = chapter?.isLocked === true;
  const isAdmin = useAuthStore((state) => state.user?.account_type === "admin");
  const lessonStates = useMemo(
    () => resolveLessonStates(chapter?.lessons, isAdmin),
    [chapter?.lessons, isAdmin]
  );
  const { t } = useTranslation();
  const chapterTitle = locale === "kh" ? chapter?.titleKh || chapter?.title : chapter?.title;
  const practiceState = resolvePracticeState(chapter);

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
          onToggle();
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
          ...HEADER_DISABLED_SX,
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
            {locale === "kh"
              ? `${t("PHRASES.LESSONS")} ${chapter?.lessonCount ?? 0} ${t("PHRASES.PLUS")} ${t("PHRASES.PRACTICE")}`
              : `${chapter?.lessonCount ?? 0} ${t("PHRASES.LESSONS")} ${t("PHRASES.PLUS")} ${t("PHRASES.PRACTICE")}`}
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
            <ExpandIcon expanded={expanded} />
          </Stack>
        </Stack>
      </ButtonBase>

      <Collapse in={expanded} unmountOnExit>
        <Stack spacing={0.75} sx={{ borderTop: `1px solid ${KslColors.border}`, p: 1 }}>
          {chapter?.lessons
            ?.filter((lesson) => isLessonVisible(lesson?.id))
            .map((lesson) => {
              const state: LessonDisplayState = lessonStates.get(lesson?.id) ?? "lock";
              return (
                <TrackRow
                  key={lesson?.id}
                  state={state}
                  locked={state === "lock" || !!lesson?.isLocked}
                  href={rows.lessonHref(lesson?.id)}
                  title={formatLessonLabel(lesson?.orderIndex, locale)}
                  subtitle={rows.getLessonSubtitle(lesson)}
                  actionLabel={rows.lessonAction}
                  variant={rows.lessonVariant}
                />
              );
            })}
          {showPractice ? (
            <TrackRow
              state={practiceState}
              locked={practiceState === "lock"}
              href={rows.practiceHref(chapter?.id)}
              title={rows.practiceTitle}
              subtitle={rows.getPracticeSubtitle(chapter)}
              subtitleSx={rows.practiceSubtitleSx}
              actionLabel={rows.practiceAction}
            />
          ) : null}
        </Stack>
      </Collapse>
    </Paper>
  );
}
