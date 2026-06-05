"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import type { FsLesson } from "@/features/finger-spelling/types";
import type { LessonDisplayState } from "@/features/finger-spelling/utils/progress";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

type LessonProgressRowProps = {
  lesson?: FsLesson;
  state?: LessonDisplayState;
  progressPercent?: number;
  variant?: "lesson" | "practice";
  title?: string;
  subtitle?: string;
  locked?: boolean;
  href?: string;
  actionLabel?: string;
};

const stateBadge: Record<
  LessonDisplayState,
  { label: string; bgcolor: string; color: string }
> = {
  done: { label: "Done", bgcolor: KslColors.primaryLighter, color: KslColors.success },
  now: { label: "Now", bgcolor: KslColors.primaryTrack, color: KslColors.primaryDark },
  lock: { label: "Lock", bgcolor: "rgba(101, 116, 110, 0.15)", color: KslColors.locked },
};

export default function LessonProgressRow(props: LessonProgressRowProps) {
  if (props.variant === "practice" || !props.lesson) {
    return (
      <PracticeRow
        title={props.title ?? "Practice"}
        subtitle={props.subtitle}
        locked={props.locked ?? false}
        href={props.href}
        actionLabel={props.actionLabel}
      />
    );
  }

  const { lesson, state = "lock", progressPercent = 0 } = props;
  const badge = stateBadge[state];
  const isInteractive = state === "now" || state === "done";
  const href = lesson.isLocked ? undefined : ROUTES.fingerSpelling.lesson(lesson.id);

  const content = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.25, md: 2 },
        p: { xs: 1.25, md: 1.5 },
        borderRadius: `${KslRadii.wordCard}px`,
        border: `1px solid ${
          state === "now" ? KslColors.primary : KslColors.border
        }`,
        bgcolor:
          state === "now"
            ? KslColors.primaryLighter
            : state === "lock"
              ? "rgba(0,0,0,0.02)"
              : "background.paper",
        opacity: state === "lock" ? 0.65 : 1,
        transition: "border-color 0.15s ease, background-color 0.15s ease",
        ...(isInteractive &&
          href && {
            "&:hover": {
              borderColor: KslColors.primary,
              bgcolor: KslColors.primaryLight,
            },
          }),
      }}
    >
      <Box
        sx={{
          minWidth: 52,
          px: 1,
          py: 0.5,
          borderRadius: 999,
          bgcolor: badge.bgcolor,
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: badge.color,
            lineHeight: 1.2,
          }}
        >
          {badge.label}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: KslFontSizes.md,
            fontWeight: 700,
            color: KslColors.secondary,
            lineHeight: 1.25,
          }}
        >
          Lesson {String(lesson.orderIndex).padStart(2, "0")}
        </Typography>
        <Typography
          sx={{
            fontSize: KslFontSizes.lg,
            fontWeight: 700,
            color: KslColors.secondary,
            mt: 0.25,
            lineHeight: 1.2,
          }}
        >
          {lesson.letter}
        </Typography>
      </Box>

      <Typography
        sx={{
          flexShrink: 0,
          fontSize: KslFontSizes.sm,
          fontWeight: 700,
          color:
            state === "done"
              ? KslColors.success
              : state === "now"
                ? KslColors.primaryDark
                : KslColors.textSecondary,
        }}
      >
        {state === "done" && `${progressPercent}%`}
        {state === "now" && "Continue"}
        {state === "lock" && "Next"}
      </Typography>
    </Box>
  );

  if (href && isInteractive) {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </Link>
    );
  }

  return content;
}

function PracticeRow({
  title,
  subtitle,
  locked,
  href,
  actionLabel = "Start",
}: {
  title: string;
  subtitle?: string;
  locked: boolean;
  href?: string;
  actionLabel?: string;
}) {
  const badge = stateBadge.lock;

  const content = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.25, md: 2 },
        p: { xs: 1.25, md: 1.5 },
        borderRadius: `${KslRadii.wordCard}px`,
        border: `1px solid ${KslColors.border}`,
        bgcolor: locked ? "rgba(0,0,0,0.02)" : "background.paper",
        opacity: locked ? 0.65 : 1,
        ...(!locked &&
          href && {
            "&:hover": {
              borderColor: KslColors.primary,
              bgcolor: KslColors.primaryLighter,
            },
          }),
      }}
    >
      <Box
        sx={{
          minWidth: 52,
          px: 1,
          py: 0.5,
          borderRadius: 999,
          bgcolor: badge.bgcolor,
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: badge.color,
          }}
        >
          {locked ? "Lock" : "Go"}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: KslFontSizes.md,
            fontWeight: 700,
            color: KslColors.secondary,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              fontSize: KslFontSizes.sm,
              color: KslColors.textSecondary,
              mt: 0.25,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      <Typography
        sx={{
          flexShrink: 0,
          fontSize: KslFontSizes.sm,
          fontWeight: 700,
          color: locked ? KslColors.textSecondary : KslColors.primaryDark,
        }}
      >
        {locked ? actionLabel : actionLabel}
      </Typography>
    </Box>
  );

  if (!locked && href) {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </Link>
    );
  }

  return content;
}
