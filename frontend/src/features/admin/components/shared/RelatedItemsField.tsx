"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Box, Chip, Skeleton, Stack, Tooltip, Typography } from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";

import type { PublishStatus } from "../../api/types";
import SearchableDropdown from "./SearchableDropdown";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RelatedItem<T = unknown> {
  id: number;
  /** Name in the active language. */
  label: string;
  /** Name in the other language, shown in the tooltip. */
  secondaryLabel?: string;
  /** Position within the parent. */
  order?: number;
  status?: PublishStatus;
  /** Opens the item (its edit page). */
  href?: string;
  /** Context shown next to a candidate in the picker, e.g. "Currently in Unit 2". */
  note?: string;
  /** The underlying row, handed back to `onAttach`. */
  source: T;
}

export interface RelatedItemsFieldProps<T> {
  /** Plural name of the children, e.g. "Chapters". */
  label: string;
  /** Picker label, e.g. "Add existing chapter". */
  addLabel: string;
  /** Children already saved under the parent. */
  items: RelatedItem<T>[];
  /** Existing rows chosen to be moved under the parent when the form is saved. */
  pending: RelatedItem<T>[];
  loading?: boolean;
  onAttach: (item: RelatedItem<T>) => void;
  onUndoAttach: (item: RelatedItem<T>) => void;
  /** Rows that could be attached; already-linked ones are filtered out here. */
  fetchCandidates: (query: string) => Promise<RelatedItem<T>[]>;
  /** How many children show before "Show more". Most chapters have ~5 lessons. */
  maxVisible?: number;
}

export const DEFAULT_MAX_VISIBLE = 5;

// ── Pieces ───────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: PublishStatus }) {
  const { t } = useTranslation();
  return (
    <Box
      component="span"
      role="img"
      aria-label={status === "published" ? t("ADMIN.PUBLISHED") : t("ADMIN.DRAFT")}
      sx={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        flexShrink: 0,
        bgcolor: status === "published" ? "success.main" : "warning.main",
      }}
    />
  );
}

function chipText(item: RelatedItem<unknown>): string {
  return item.order !== undefined ? `${item.order}. ${item.label}` : item.label;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Compact list of a parent's children (unit -> chapters, chapter -> lessons) shown as small
 * chips: click one to open it, and use the picker to attach an existing row. Long lists fold
 * behind "Show more" so the form stays short.
 */
export default function RelatedItemsField<T>({
  label,
  addLabel,
  items,
  pending,
  loading = false,
  onAttach,
  onUndoAttach,
  fetchCandidates,
  maxVisible = DEFAULT_MAX_VISIBLE,
}: RelatedItemsFieldProps<T>) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [items],
  );
  const hiddenCount = Math.max(0, sorted.length - maxVisible);
  const visible = expanded ? sorted : sorted.slice(0, maxVisible);

  const linkedIds = useMemo(
    () => new Set([...items, ...pending].map((item) => item.id)),
    [items, pending],
  );

  const fetchOptions = useCallback(
    async (query: string) => {
      const candidates = await fetchCandidates(query);
      return candidates.filter((candidate) => !linkedIds.has(candidate.id));
    },
    [fetchCandidates, linkedIds],
  );

  const handleAttach = useCallback(
    (item: RelatedItem<T> | null) => {
      if (item && !linkedIds.has(item.id)) onAttach(item);
    },
    [onAttach, linkedIds],
  );

  const isEmpty = !loading && items.length === 0 && pending.length === 0;

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {label} ({items.length + pending.length})
      </Typography>

      {loading ? (
        <Stack direction="row" spacing={1}>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} variant="rounded" width={96} height={24} />
          ))}
        </Stack>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {visible.map((item) => (
            // describeChild: the tooltip describes the chip instead of replacing its accessible name.
            <Tooltip
              key={item.id}
              describeChild
              title={[item.secondaryLabel, item.status === "draft" ? t("ADMIN.DRAFT") : undefined]
                .filter(Boolean)
                .join(" · ")}
              disableHoverListener={!item.secondaryLabel && item.status !== "draft"}
            >
              <Chip
                size="small"
                variant="outlined"
                label={chipText(item)}
                icon={item.status ? <StatusDot status={item.status} /> : undefined}
                {...(item.href ? { component: Link, href: item.href, clickable: true } : {})}
                sx={{ "& .MuiChip-icon": { ml: 1, mr: -0.25 } }}
              />
            </Tooltip>
          ))}

          {hiddenCount > 0 && (
            <Chip
              size="small"
              label={
                expanded
                  ? t("FORM.SHOW_LESS")
                  : `${t("FORM.SHOW_MORE")} (+${hiddenCount})`
              }
              onClick={() => setExpanded((prev) => !prev)}
              sx={{ fontWeight: 600 }}
            />
          )}

          {pending.map((item) => (
            <Tooltip key={`pending-${item.id}`} describeChild title={t("FORM.RELATED_PENDING")}>
              <Chip
                size="small"
                variant="outlined"
                color="primary"
                label={item.label}
                onDelete={() => onUndoAttach(item)}
                sx={{ borderStyle: "dashed" }}
              />
            </Tooltip>
          ))}
        </Box>
      )}

      {isEmpty && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {t("FORM.RELATED_EMPTY")}
        </Typography>
      )}

      <SearchableDropdown<RelatedItem<T>>
        label={addLabel}
        value={null}
        onChange={handleAttach}
        fetchOptions={fetchOptions}
        getOptionLabel={(option) =>
          option.note ? `${option.label} · ${option.note}` : option.label
        }
        getOptionKey={(option) => option.id}
        placeholder={t("FORM.SEARCH_PLACEHOLDER")}
        clearOnSelect
      />

      {pending.length > 0 && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {t("FORM.RELATED_ATTACH_NOTE")}
        </Typography>
      )}
    </Stack>
  );
}
