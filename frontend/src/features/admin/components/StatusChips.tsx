"use client";

import { Chip } from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";

import type { PublishStatus } from "../api/types";

const chipSx = (bg: string, color: string) => ({
  height: 22,
  fontSize: "0.625rem",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  bgcolor: bg,
  color,
});

/** Compact Active/Inactive badge (soft-delete state). */
export function ActiveChip({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return active ? (
    <Chip
      label={t("ADMIN.ACTIVE")}
      size="small"
      sx={chipSx("rgba(34, 197, 94, 0.12)", "#118D57")}
    />
  ) : (
    <Chip
      label={t("ADMIN.INACTIVE")}
      size="small"
      sx={chipSx("rgba(145, 158, 171, 0.12)", "#637381")}
    />
  );
}

/** Compact Draft/Published badge (confirm-publish workflow state). */
export function PublishChip({ status }: { status: PublishStatus }) {
  const { t } = useTranslation();
  return status === "published" ? (
    <Chip
      label={t("ADMIN.PUBLISHED")}
      size="small"
      sx={chipSx("rgba(34, 197, 94, 0.12)", "#118D57")}
    />
  ) : (
    <Chip
      label={t("ADMIN.DRAFT")}
      size="small"
      sx={chipSx("rgba(255, 171, 0, 0.12)", "#B76E00")}
    />
  );
}
