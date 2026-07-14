"use client";

import { Chip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export type StatusVariant = "published" | "draft" | "active" | "inactive" | "pending";

export interface StatusChipProps {
  variant: StatusVariant;
  label?: string;
  sx?: SxProps<Theme>;
}

const STATUS_COLORS: Record<StatusVariant, { bg: string; text: string }> = {
  published: { bg: "rgba(34, 197, 94, 0.12)", text: "#118D57" },
  draft: { bg: "rgba(255, 171, 0, 0.12)", text: "#B76E00" },
  active: { bg: "rgba(34, 197, 94, 0.12)", text: "#118D57" },
  inactive: { bg: "rgba(145, 158, 171, 0.12)", text: "#637381" },
  pending: { bg: "rgba(0, 184, 217, 0.12)", text: "#006C9C" },
};

const DEFAULT_LABELS: Record<StatusVariant, string> = {
  published: "Published",
  draft: "Draft",
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
};

export default function StatusChip({ variant, label, sx }: StatusChipProps) {
  const colors = STATUS_COLORS[variant];

  return (
    <Chip
      label={label ?? DEFAULT_LABELS[variant]}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        borderRadius: "6px",
        fontWeight: 700,
        fontSize: "0.75rem",
        height: 24,
        ...sx,
      }}
    />
  );
}
