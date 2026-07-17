"use client";

import {
  Alert,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DataTable, {
  type DataTableColumn,
} from "../components/shared/DataTable";
import PageHeader from "../components/shared/PageHeader";
import RowActionsMenu from "../components/shared/RowActionsMenu";
import PreviewDrawer from "../components/shared/PreviewDrawer";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { ApiError } from "@/utils/api/client";
import {
  listFeedback,
  deleteFeedback,
  type FeedbackItem,
  type PaginatedFeedbackResponse,
} from "../api/feedbackAdminApi";

// ── Types ────────────────────────────────────────────────────────────────────

type MoodFilter = "all" | "very_bad" | "bad" | "okay" | "good" | "excellent";
type TypeFilter = "all" | "finger_spelling" | "words";

// ── Mood chip color mapping ──────────────────────────────────────────────────

const MOOD_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  very_bad: { bg: "rgba(255, 86, 48, 0.12)", text: "#B71D18" },
  bad: { bg: "rgba(255, 171, 0, 0.12)", text: "#B76E00" },
  okay: { bg: "rgba(255, 214, 102, 0.12)", text: "#B78103" },
  good: { bg: "rgba(34, 197, 94, 0.12)", text: "#118D57" },
  excellent: { bg: "rgba(0, 184, 217, 0.12)", text: "#006C9C" },
};

const TYPE_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  finger_spelling: { bg: "rgba(0, 184, 217, 0.12)", text: "#006C9C" },
  words: { bg: "rgba(145, 158, 171, 0.12)", text: "#637381" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMoodLabel(mood: string): string {
  return mood
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatTypeLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function truncate(text: string | null, maxLen = 60): string {
  if (!text) return "—";
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  // ── Filter state ─────────────────────────────────────────────────────────
  const [moodFilter, setMoodFilter] = useState<MoodFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── Pagination state ─────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ── Data state ───────────────────────────────────────────────────────────
  const [data, setData] = useState<PaginatedFeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [previewItem, setPreviewItem] = useState<FeedbackItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Debounce search ──────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  // ── Fetch data ───────────────────────────────────────────────────────────
  const fetchFeedback = useCallback(() => {
    setLoading(true);
    setError(null);

    return listFeedback({
      page: page + 1, // API is 1-indexed
      size: rowsPerPage,
      mood: moodFilter !== "all" ? moodFilter : undefined,
      type: typeFilter !== "all" ? typeFilter : undefined,
      search: debouncedSearch || undefined,
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load feedback");
        setLoading(false);
      });
  }, [page, rowsPerPage, moodFilter, typeFilter, debouncedSearch]);

  useEffect(() => {
    void fetchFeedback();
  }, [fetchFeedback]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFeedback(deleteTarget.id);
      setDeleteTarget(null);
      void fetchFeedback();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete feedback");
    } finally {
      setDeleting(false);
    }
  };

  // ── Table columns ────────────────────────────────────────────────────────
  const columns: DataTableColumn<FeedbackItem>[] = useMemo(
    () => [
      {
        id: "id",
        label: "ID",
        width: 70,
        render: (row) => row.id,
      },
      {
        id: "type",
        label: "Type",
        width: 140,
        render: (row) => {
          if (!row.type) return "—";
          const colors = TYPE_CHIP_COLORS[row.type] ?? TYPE_CHIP_COLORS.words;
          return (
            <Chip
              label={formatTypeLabel(row.type)}
              size="small"
              sx={{
                bgcolor: colors.bg,
                color: colors.text,
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "0.75rem",
                height: 24,
              }}
            />
          );
        },
      },
      {
        id: "category",
        label: "Category",
        width: 140,
        render: (row) => row.category,
      },
      {
        id: "characteristic",
        label: "Characteristic",
        width: 160,
        render: (row) => row.characteristic,
      },
      {
        id: "mood",
        label: "Mood",
        width: 120,
        render: (row) => {
          if (!row.mood) return "—";
          const colors = MOOD_CHIP_COLORS[row.mood] ?? MOOD_CHIP_COLORS.okay;
          return (
            <Chip
              label={formatMoodLabel(row.mood)}
              size="small"
              sx={{
                bgcolor: colors.bg,
                color: colors.text,
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "0.75rem",
                height: 24,
              }}
            />
          );
        },
      },
      {
        id: "comment",
        label: "Comment",
        width: 220,
        render: (row) => (
          <Typography
            variant="body2"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {truncate(row.comment)}
          </Typography>
        ),
      },
      {
        id: "created_at",
        label: "Created At",
        width: 140,
        render: (row) =>
          row.created_at
            ? new Date(row.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "—",
      },
      {
        id: "actions",
        label: "Actions",
        width: 80,
        sortable: false,
        render: (row) => (
          <RowActionsMenu
            onPreview={() => setPreviewItem(row)}
            onDelete={() => setDeleteTarget(row)}
          />
        ),
      },
    ],
    [],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((rpp: number) => {
    setRowsPerPage(rpp);
    setPage(0);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Feedback"
        subtitle="Review lesson feedback submitted by learners"
      />

      {/* Filters */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          size="small"
          label="Search"
          placeholder="Search comments, category…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 220 }}
        />

        <TextField
          select
          size="small"
          label="Mood"
          value={moodFilter}
          onChange={(e) => {
            setMoodFilter(e.target.value as MoodFilter);
            setPage(0);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="very_bad">Very Bad</MenuItem>
          <MenuItem value="bad">Bad</MenuItem>
          <MenuItem value="okay">Okay</MenuItem>
          <MenuItem value="good">Good</MenuItem>
          <MenuItem value="excellent">Excellent</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Type"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as TypeFilter);
            setPage(0);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="finger_spelling">Finger Spelling</MenuItem>
          <MenuItem value="words">Words</MenuItem>
        </TextField>
      </Stack>

      {/* Error */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Data Table */}
      <DataTable<FeedbackItem>
        columns={columns}
        rows={data?.items ?? []}
        loading={loading}
        onRowClick={(row) => setPreviewItem(row)}
        pagination={{
          page,
          rowsPerPage,
          total: data?.total ?? 0,
        }}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      {/* Preview drawer */}
      <PreviewDrawer
        open={previewItem !== null}
        onClose={() => setPreviewItem(null)}
        title={`Feedback #${previewItem?.id ?? ""}`}
        subtitle={previewItem?.category}
        fields={
          previewItem
            ? [
                { label: "Type", value: previewItem.type ? formatTypeLabel(previewItem.type) : "—" },
                { label: "Category", value: previewItem.category },
                { label: "Characteristic", value: previewItem.characteristic },
                { label: "Mood", value: previewItem.mood ? formatMoodLabel(previewItem.mood) : "—" },
                { label: "Comment", value: previewItem.comment ?? "—" },
                {
                  label: "Created At",
                  value: previewItem.created_at
                    ? new Date(previewItem.created_at).toLocaleString()
                    : "—",
                },
              ]
            : []
        }
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Feedback?"
        message="Are you sure you want to delete this feedback entry? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </Stack>
  );
}
