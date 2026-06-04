"use client";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import LockBadge from "@/components/ui/LockBadge";
import PlayButton from "@/components/ui/PlayButton";
import { ROUTES } from "@/constants/routes";
import { getExerciseRangeDescriptionPair } from "@/features/finger-spelling/utils/chapter";
import { useTranslation } from "@/i18n/useTranslation";
import { kslColors, kslFontSizes, kslRadii, kslShadows } from "@/theme/theme";
import type { FsExercise } from "../../types";

type ExerciseCardProps = {
  exercise: FsExercise;
  /** Render inside exercise accordion without duplicate header. */
  embedded?: boolean;
};

export default function ExerciseCard({
  exercise,
  embedded = false,
}: ExerciseCardProps) {
  const { t, locale } = useTranslation();
  const locked = !exercise.isUnlocked;
  const href = locked
    ? undefined
    : ROUTES.fingerSpelling.exerciseChapter(exercise.chapterId);

  if (embedded) {
    const content = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: { xs: 1.25, md: 1.5 },
          borderRadius: `${kslRadii.wordCard}px`,
          border: `1px solid ${kslColors.border}`,
          bgcolor: "background.paper",
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
              fontSize: kslFontSizes.md,
              fontWeight: 700,
              color: kslColors.secondary,
            }}
          >
            {t("fsExerciseTitle")}
          </Typography>
          <Typography
            sx={{
              mt: 0.25,
              fontSize: kslFontSizes.sm,
              color: kslColors.textSecondary,
            }}
          >
            {t("fsExerciseScore")
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

  const { primary, secondary } = getExerciseRangeDescriptionPair(
    exercise,
    locale
  );

  return (
    <Box
      sx={{
        borderRadius: `${kslRadii.card}px`,
        boxShadow: kslShadows.card,
        bgcolor: "background.paper",
        opacity: locked ? 0.75 : 1,
        mb: 2,
      }}
    >
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontSize: kslFontSizes.lg,
                fontWeight: 700,
                color: kslColors.secondary,
              }}
            >
              {primary}
            </Typography>
            {secondary && (
              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: kslFontSizes.sm,
                  color: kslColors.textSecondary,
                }}
              >
                {secondary}
              </Typography>
            )}
            <Typography
              sx={{
                mt: 1,
                fontSize: kslFontSizes.sm,
                color: kslColors.textSecondary,
              }}
            >
              {t("fsExerciseScore")
                .replace("{score}", String(exercise.score))
                .replace("{max}", String(exercise.maxScore))}
            </Typography>
          </Box>
          {locked ? (
            <LockBadge />
          ) : href ? (
            <Link href={href}>
              <PlayButton />
            </Link>
          ) : (
            <PlayButton />
          )}
        </Box>
        {!locked && exercise.maxScore > 0 && (
          <LinearProgress
            variant="determinate"
            value={Math.round((exercise.score / exercise.maxScore) * 100)}
            sx={{ mt: 1.5, width: "100%" }}
          />
        )}
      </Box>
    </Box>
  );
}
