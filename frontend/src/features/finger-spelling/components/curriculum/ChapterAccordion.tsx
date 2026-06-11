"use client";

import Box from "@mui/material/Box";

import CircularProgress from "@mui/material/CircularProgress";

import Collapse from "@mui/material/Collapse";

import Typography from "@mui/material/Typography";

import { useMemo, useState } from "react";

import ExpandToggle from "@/components/ui/ExpandToggle";

import { ROUTES } from "@/constants/routes";

import { useFsLessons } from "@/features/finger-spelling/hooks/useFsLessons";

import type { FsChapter } from "@/features/finger-spelling/types";

import {
  formatChapterBadge,
  getChapterRangeDescriptionPair,
  toKhmerNumeral,
} from "@/features/finger-spelling/utils/chapter";

import {
  getLessonProgressPercent,
  resolveLessonStates,
} from "@/features/finger-spelling/utils/progress";

import { useTranslation } from "@/i18n/useTranslation";

import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

import LessonProgressRow from "./LessonProgressRow";

type ChapterAccordionProps = {
  chapter: FsChapter;

  defaultExpanded?: boolean;
};

export default function ChapterAccordion({
  chapter,

  defaultExpanded = false,
}: ChapterAccordionProps) {
  const locked = chapter.isLocked === true;

  const { t, locale } = useTranslation();

  const { primary, secondary } = getChapterRangeDescriptionPair(
    chapter,
    locale,
  );

  const chapterBadge = formatChapterBadge(
    chapter.orderIndex,

    locale,

    t("fsChapter"),
  );

  const [expanded, setExpanded] = useState(defaultExpanded && !locked);

  const { data: lessons, isLoading } = useFsLessons(chapter.id, expanded);

  const lessonStates = useMemo(
    () => (lessons ? resolveLessonStates(lessons) : new Map()),

    [lessons],
  );

  const practiceLocked = !chapter.isExerciseUnlocked;

  const metaLine = locked
    ? `${t("fsChapterLockedUntil")} ${locale === "kh"
      ? toKhmerNumeral(chapter.orderIndex - 1).padStart(2, "០")
      : String(chapter.orderIndex - 1).padStart(2, "0")
    }`
    : t("fsChapterLessonsPractice").replace(
      "{count}",

      String(chapter.lessonCount),
    );

  return (
    <Box
      sx={{
        border: `1px solid ${KslColors.border}`,

        borderRadius: `${KslRadii.card}px`,

        bgcolor: "background.paper",

        overflow: "hidden",

        opacity: locked ? 0.6 : 1,
      }}
    >
      <Box
        component="button"
        type="button"
        disabled={locked}
        onClick={() => !locked && setExpanded((prev) => !prev)}
        sx={{
          display: "flex",

          alignItems: "center",

          gap: { xs: 1.5, md: 2 },

          width: "100%",

          p: { xs: 1.5, md: 2 },

          border: "none",

          bgcolor: expanded && !locked ? KslColors.primaryLight : "transparent",

          cursor: locked ? "not-allowed" : "pointer",

          textAlign: "left",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: KslFontSizes.sm,

              fontWeight: 700,

              letterSpacing: "0.06em",

              textTransform: "uppercase",

              color: KslColors.primary,
            }}
          >
            {chapterBadge}
          </Typography>

          <Typography
            sx={{
              mt: 0.25,

              fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },

              fontWeight: 700,

              color: KslColors.secondary,

              lineHeight: 1.25,
            }}
          >
            {primary}
          </Typography>

          {secondary && (
            <Typography
              sx={{
                mt: 0.5,

                fontSize: KslFontSizes.sm,

                color: KslColors.textSecondary,
              }}
            >
              {secondary}
            </Typography>
          )}

          <Typography
            sx={{
              mt: 0.5,

              fontSize: KslFontSizes.sm,

              color: KslColors.textSecondary,
            }}
          >
            {metaLine}
          </Typography>
        </Box>

        <ExpandToggle
          expanded={expanded}
          disabled={locked}
          onClick={() => setExpanded((prev) => !prev)}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${primary}`}
        />
      </Box>

      <Collapse in={expanded && !locked} unmountOnExit>
        <Box
          sx={{
            px: { xs: 1.5, md: 2 },

            pb: { xs: 1.5, md: 2 },

            display: "flex",

            flexDirection: "column",

            gap: 1,
          }}
        >
          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {lessons?.map((lesson) => (
            <LessonProgressRow
              key={lesson.id}
              lesson={lesson}
              state={lessonStates.get(lesson.id) ?? "lock"}
              progressPercent={getLessonProgressPercent(lesson)}
            />
          ))}

          <LessonProgressRow
            variant="practice"
            title="Practice"
            subtitle={`Random review from ${chapterBadge}`}
            locked={practiceLocked}
            href={
              practiceLocked
                ? undefined
                : ROUTES.fingerSpelling.exerciseChapter(chapter.id)
            }
            actionLabel={
              practiceLocked ? `After ${chapter.lessonCount} lessons` : "Start"
            }
          />
        </Box>
      </Collapse>
    </Box>
  );
}
