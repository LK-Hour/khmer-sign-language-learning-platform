"use client";

import { Chip } from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";

import { AdminColors, AdminFontSizes } from "./adminTokens";
import type { PublishStatus } from "../api/types";

const chipSx = (bg: string, color: string) => ({
  height: 22,
  fontSize: AdminFontSizes.eyebrow,
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
      sx={chipSx(AdminColors.activeBg, AdminColors.activeText)}
    />
  ) : (
    <Chip
      label={t("ADMIN.INACTIVE")}
      size="small"
      sx={chipSx(AdminColors.inactiveBg, AdminColors.inactiveText)}
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
      sx={chipSx(AdminColors.publishedBg, AdminColors.publishedText)}
    />
  ) : (
    <Chip
      label={t("ADMIN.DRAFT")}
      size="small"
      sx={chipSx(AdminColors.draftBg, AdminColors.draftText)}
    />
  );
}
