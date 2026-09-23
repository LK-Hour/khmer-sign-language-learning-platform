"use client";

import { Chip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import { statusTone, type StatusTone } from "../../theme/tones";

export type StatusVariant = "published" | "draft" | "active" | "inactive" | "pending";

export interface StatusChipProps {
  variant: StatusVariant;
  label?: string;
  sx?: SxProps<Theme>;
}

const STATUS_TONES: Record<StatusVariant, StatusTone> = {
  published: "success",
  draft: "warning",
  active: "success",
  inactive: "neutral",
  pending: "info",
};

const DEFAULT_LABELS: Record<StatusVariant, string> = {
  published: "Published",
  draft: "Draft",
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
};

export default function StatusChip({ variant, label, sx }: StatusChipProps) {
  return (
    <Chip
      label={label ?? DEFAULT_LABELS[variant]}
      size="small"
      sx={[
        (theme) => ({
          ...statusTone(theme, STATUS_TONES[variant]),
          borderRadius: "6px",
          fontWeight: 700,
          fontSize: "0.75rem",
          height: 24,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
