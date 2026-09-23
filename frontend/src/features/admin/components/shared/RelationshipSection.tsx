"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import { Chip, Stack, Typography } from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";

export interface RelationshipParent {
  /** What the parent is, e.g. "Unit". */
  typeLabel: string;
  /** Name in the active language. */
  name: string;
  /** Opens the parent's edit page. */
  href?: string;
}

export interface RelationshipSectionProps {
  /**
   * The parent this row belongs to. Pass `null` when none is chosen yet: chapters and
   * lessons always need one, and it is picked in the main form above.
   */
  parent?: RelationshipParent | null;
  /** Children editor(s). */
  children: ReactNode;
}

/**
 * "Relationships" block shown above Save/Cancel on the curriculum forms: a link up to the
 * parent, then the children below it. Pass `parent={undefined}` for top-level rows (units).
 */
export default function RelationshipSection({ parent, children }: RelationshipSectionProps) {
  const { t } = useTranslation();

  return (
    <Stack spacing={2.5}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {t("FORM.RELATIONSHIPS")}
      </Typography>

      {parent !== undefined && (
        <Stack spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {t("FORM.PARENT")}
          </Typography>
          {parent ? (
            <Chip
              size="small"
              variant="outlined"
              icon={<ArrowUpwardRoundedIcon />}
              label={`${parent.typeLabel} · ${parent.name}`}
              {...(parent.href ? { component: Link, href: parent.href, clickable: true } : {})}
              sx={{ alignSelf: "flex-start" }}
            />
          ) : (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {t("FORM.PARENT_NOT_CHOSEN")}
            </Typography>
          )}
        </Stack>
      )}

      {children}
    </Stack>
  );
}
