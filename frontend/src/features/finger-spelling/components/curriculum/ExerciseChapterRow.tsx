"use client";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import LockBadge from "@/components/ui/LockBadge";
import PlayButton from "@/components/ui/PlayButton";
import { ROUTES } from "@/constants/routes";
import type { FsExercise } from "@/features/finger-spelling/types";
import {
  formatChapterBadge,
  getExerciseRangeDescriptionPair,
} from "@/features/finger-spelling/utils/chapter";
import { useTranslation } from "@/i18n/useTranslation";
import { kslColors, kslFontSizes, kslRadii } from "@/theme/theme";

type ExerciseChapterRowProps = {
  exercise: FsExercise;
};

export default function ExerciseChapterRow({ exercise }: ExerciseChapterRowProps) {
  const { t, locale } = useTranslation();
  const locked = !exercise.isUnlocked;
  const href = locked
    ? undefined
    : ROUTES.fingerSpelling.exerciseChapter(exercise.chapterId);
  const { primary, secondary } = getExerciseRangeDescriptionPair(
    exercise,
    locale
  );
  const chapterBadge = formatChapterBadge(
    exercise.chapterOrderIndex,
    locale,
    t("fsChapter")
  );

  const content = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.25, md: 2 },
        p: { xs: 1.25, md: 1.5 },
        borderRadius: `${kslRadii.wordCard}px`,
        border: `1px solid ${kslColors.border}`,
        bgcolor: locked ? "rgba(0,0,0,0.02)" : "background.paper",
        opacity: locked ? 0.65 : 1,
        ...(href && {
          "&:hover": {
            borderColor: kslColors.primary,
            bgcolor: "rgba(250, 171, 97, 0.08)",
          },
        }),
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: kslFontSizes.sm,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: kslColors.primary,
          }}
        >
          {chapterBadge}
        </Typography>
        <Typography
          sx={{
            mt: 0.25,
            fontSize: kslFontSizes.md,
            fontWeight: 700,
            color: kslColors.secondary,
            lineHeight: 1.25,
          }}
        >
          {primary}
        </Typography>
        {secondary && (
          <Typography
            sx={{
              mt: 0.25,
              fontSize: kslFontSizes.sm,
              color: kslColors.textSecondary,
            }}
          >
            {secondary}
          </Typography>
        )}
        <Typography
          sx={{
            mt: 0.5,
            fontSize: kslFontSizes.sm,
            color: kslColors.textSecondary,
          }}
        >
          {locked
            ? t("fsExerciseLockedHint")
            : t("fsExerciseScore")
                .replace("{score}", String(exercise.score))
                .replace("{max}", String(exercise.maxScore))}
        </Typography>
        {!locked && exercise.maxScore > 0 && (
          <LinearProgress
            variant="determinate"
            value={Math.round((exercise.score / exercise.maxScore) * 100)}
            sx={{ mt: 1, width: "100%" }}
          />
        )}
      </Box>
      {locked ? <LockBadge /> : <PlayButton />}
    </Box>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </Link>
    );
  }

  return content;
}
