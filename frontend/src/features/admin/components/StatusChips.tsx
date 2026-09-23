"use client";

import { Chip } from "@mui/material";
import type { Theme } from "@mui/material/styles";

import { useTranslation } from "@/i18n/useTranslation";

import type { PublishStatus } from "../api/types";
import { statusTone, type StatusTone } from "../theme/tones";

const chipSx = (tone: StatusTone) => (theme: Theme) => ({
  height: 22,
  fontSize: "0.625rem",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  ...statusTone(theme, tone),
});

/** Compact Active/Inactive badge (soft-delete state). */
export function ActiveChip({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return active ? (
    <Chip label={t("ADMIN.ACTIVE")} size="small" sx={chipSx("success")} />
  ) : (
    <Chip label={t("ADMIN.INACTIVE")} size="small" sx={chipSx("neutral")} />
  );
}

/** Compact Draft/Published badge (confirm-publish workflow state). */
export function PublishChip({ status }: { status: PublishStatus }) {
  const { t } = useTranslation();
  return status === "published" ? (
    <Chip label={t("ADMIN.PUBLISHED")} size="small" sx={chipSx("success")} />
  ) : (
    <Chip label={t("ADMIN.DRAFT")} size="small" sx={chipSx("warning")} />
  );
}
