"use client";

import { Icon } from "@iconify/react";
import { Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { LessonDisplayState } from "@/features/shared/trackProgress";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";

type RowStatusStyle = {
  icon: string;
  iconBg: string;
  iconInnerBg?: string;
  iconColor: string;
  showCompletedLabel: boolean;
  rowBg: string;
  rowBorder: string;
  rowOpacity: number;
};

const ROW_STATUS: Record<LessonDisplayState, RowStatusStyle> = {
  done: {
    icon: "mdi:check-bold",
    iconBg: "rgba(31,159,111,0.18)",
    iconInnerBg: KslColors.success,
    iconColor: "#fff",
    showCompletedLabel: true,
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
    rowBg: "#fffbf0",
    rowBorder: "rgba(243,184,63,0.55)",
    rowOpacity: 1,
  },
  lock: {
    icon: "solar:lock-keyhole-bold",
    iconBg: "rgba(101,116,110,0.14)",
    iconColor: KslColors.locked,
    showCompletedLabel: false,
    rowBg: "background.paper",
    rowBorder: KslColors.border,
    rowOpacity: 0.65,
  },
};

const ROW_TRANSITION =
  "border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease";

const ROW_TEXT_SX = {
  color: KslColors.textPrimary,
  fontSize: KslFontSizes.md,
  fontWeight: 700,
  lineHeight: 1.25,
};

const STATUS_LABEL_SX = {
  fontSize: KslFontSizes.sm,
  fontWeight: 700,
  lineHeight: 1,
};

export type TrackRowProps = {
  state: LessonDisplayState;
  /** When true the row is not clickable (rendered without a link). */
  locked: boolean;
  href: string;
  title: string;
  subtitle: string;
  /** Label shown next to the icon while the row is the current step. */
  actionLabel: string;
  /**
   * `inline`: title and subtitle share one style (finger-spelling lessons and
   * all practice rows). `word`: muted lesson number with a larger word label.
   */
  variant?: "inline" | "word";
  /** Overrides for the inline subtitle typography. */
  subtitleSx?: { fontSize?: number | string; fontFamily?: string };
};

/** Lesson / chapter-practice row inside an expanded track chapter. */
export function TrackRow({
  state,
  locked,
  href,
  title,
  subtitle,
  actionLabel,
  variant = "inline",
  subtitleSx,
}: TrackRowProps) {
  const status = ROW_STATUS[state];
  const unlocked = !locked;

  const paperSx = {
    bgcolor: status.rowBg,
    border: `1px solid ${status.rowBorder}`,
    borderRadius: `${KslRadii.wordCard + 4}px`,
    opacity: status.rowOpacity,
    cursor: unlocked ? "pointer" : "not-allowed",
    transform: "translateY(0)",
    transition: ROW_TRANSITION,
    ...(unlocked && {
      "&:hover": {
        bgcolor: KslColors.primaryLighter,
        borderColor: KslColors.primary,
        boxShadow: KslShadows.card,
        transform: "translateY(-3px)",
      },
    }),
  };

  const statusContent = (
    <TrackRowStatus status={status} showAction={state === "now"} actionLabel={actionLabel} />
  );

  const row =
    variant === "word" ? (
      <Paper elevation={0} sx={{ ...paperSx, overflow: "hidden" }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", px: { xs: 1.25, md: 2 }, py: 1.25 }}
        >
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
              {subtitle}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
            {statusContent}
          </Stack>
        </Stack>
      </Paper>
    ) : (
      <Paper
        elevation={0}
        sx={{
          ...paperSx,
          alignItems: "center",
          display: "flex",
          gap: { xs: 1.25, md: 2 },
          px: { xs: 1.25, md: 2 },
          py: 1.25,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={ROW_TEXT_SX}>{title}:</Typography>
          <Typography sx={{ ...ROW_TEXT_SX, ...subtitleSx }}>
            {subtitle}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexShrink: 0 }}>
          <Stack component="span" direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {statusContent}
          </Stack>
        </Stack>
      </Paper>
    );

  if (!unlocked) return row;

  return (
    <Link href={href} style={{ color: "inherit", textDecoration: "none" }}>
      {row}
    </Link>
  );
}

function TrackRowStatus({
  status,
  showAction,
  actionLabel,
}: {
  status: RowStatusStyle;
  showAction: boolean;
  actionLabel: string;
}) {
  const { t } = useTranslation();

  return (
    <>
      {status.showCompletedLabel ? (
        <Typography sx={{ ...STATUS_LABEL_SX, color: KslColors.success }}>
          {t("PHRASES.COMPLETED")}
        </Typography>
      ) : null}
      {showAction ? (
        <Typography sx={{ ...STATUS_LABEL_SX, color: KslColors.inProgress }}>
          {actionLabel}
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
    </>
  );
}
