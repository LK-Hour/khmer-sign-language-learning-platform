"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Add from "@mui/icons-material/Add";
import { alpha, type Theme } from "@mui/material/styles";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Box,
} from "@mui/material";
import PageHeader from "../components/shared/PageHeader";
import DataTable, { type DataTableColumn } from "../components/shared/DataTable";
import StatusChip from "../components/shared/StatusChip";
import RowActionsMenu from "../components/shared/RowActionsMenu";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { listExercises, deleteExercise } from "../api/adminApi";
import type { AdminExercise, AdminTrack, PublishStatus } from "../api/types";
import { ApiError } from "@/utils/api/client";
import { useLocale } from "@/i18n/locale-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuizExercise {
  id: number;
  question: string;
  question_kh: string;
  type: string;
  options_count: number;
  status: PublishStatus;
}

export interface UnitQuizPageProps {
  unitId: number;
  track: AdminTrack;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeLabel(type: string): string {
  switch (type) {
    case "multiple_choice":
      return "Multiple Choice";
    case "image_select":
      return "Image Choice";
    case "free_form":
      return "Text Input";
    case "matching":
      return "Matching";
    default:
      return type;
  }
}

// [base color, lighter text shade used in dark mode where the base is < 4.5:1 on the surface]
function typeChipColors(type: string): [string, string] {
  switch (type) {
    case "multiple_choice":
      return ["#4f46e5", "#a5b4fc"];
    case "image_select":
      return ["#d97706", "#fcd34d"];
    case "matching":
      return ["#ec4899", "#f9a8d4"];
    default:
      return ["#059669", "#6ee7b7"];
  }
}

function typeChipColor(theme: Theme, type: string) {
  const dark = theme.palette.mode === "dark";
  const [base, darkText] = typeChipColors(type);
  return { bgcolor: alpha(base, dark ? 0.16 : 0.08), color: dark ? darkText : base };
}

function mapExercises(data: AdminExercise[]): QuizExercise[] {
  return data.map((ex) => ({
    id: ex.id,
    question: ex.question_en || ex.question_kh,
    question_kh: ex.question_kh,
    type: ex.exercise_type,
    options_count: ex.options?.length ?? 0,
    status: ex.publish_status,
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UnitQuizPage({ unitId, track }: UnitQuizPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Data fetching state
  const [exercises, setExercises] = useState<QuizExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<QuizExercise | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listExercises(track, { unit_id: unitId });
      setExercises(mapExercises(data));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load exercises",
      );
    } finally {
      setLoading(false);
    }
  }, [track, unitId]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const pagedRows = useMemo(
    () => exercises.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [exercises, page, rowsPerPage],
  );

  const trackSegment = track === "finger" ? "finger-spelling" : "word-detection";

  const handleCreate = useCallback(() => {
    router.push(`/${locale}/admin/learning/quiz/${trackSegment}/exercises/create`);
  }, [router, locale, trackSegment]);

  const handleEdit = useCallback((exerciseId: number) => {
    router.push(`/${locale}/admin/learning/quiz/${trackSegment}/exercises/${exerciseId}/edit`);
  }, [router, locale, trackSegment]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExercise(track, deleteTarget.id);
      setDeleteTarget(null);
      await fetchExercises();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete exercise");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, track, fetchExercises]);

  // Table columns: ID, Question, Type, Options count, Status, Actions
  const columns: DataTableColumn<QuizExercise>[] = useMemo(
    () => [
      { id: "id", label: "ID", width: 60 },
      {
        id: "question",
        label: "Question",
        render: (row) => row.question,
      },
      {
        id: "type",
        label: "Type",
        width: 150,
        render: (row) => (
          <Chip
            label={typeLabel(row.type)}
            size="small"
            sx={(theme) => ({
              ...typeChipColor(theme, row.type),
              height: 22,
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
            })}
          />
        ),
      },
      {
        id: "options_count",
        label: "Options count",
        width: 120,
        render: (row) => row.options_count,
      },
      {
        id: "status",
        label: "Status",
        width: 120,
        render: (row) => <StatusChip variant={row.status} />,
      },
      {
        id: "actions",
        label: "Actions",
        sortable: false,
        width: 80,
        render: (row) => (
          <RowActionsMenu
            onEdit={() => handleEdit(row.id)}
            onDelete={() => setDeleteTarget(row)}
          />
        ),
      },
    ],
    [handleEdit],
  );

  const trackLabel = track === "finger" ? "Finger Spelling" : "Word Detection";

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <PageHeader
          title={`Unit ${unitId} Quiz`}
          breadcrumbs={[
            { label: "Learning" },
            { label: trackLabel },
            { label: "Unit Quiz" },
            { label: `Unit ${unitId}` },
          ]}
        />
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <>
        <PageHeader
          title={`Unit ${unitId} Quiz`}
          breadcrumbs={[
            { label: "Learning" },
            { label: trackLabel },
            { label: "Unit Quiz" },
            { label: `Unit ${unitId}` },
          ]}
        />
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={fetchExercises}>
              Retry
            </Button>
          }
          sx={{ mx: 3, mt: 2 }}
        >
          {error}
        </Alert>
      </>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title={`Unit ${unitId} Quiz`}
        breadcrumbs={[
          { label: "Learning" },
          { label: trackLabel },
          { label: "Unit Quiz" },
          { label: `Unit ${unitId}` },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Add Exercise
          </Button>
        }
      />

      <DataTable<QuizExercise>
        columns={columns}
        rows={pagedRows}
        onRowClick={(row) => handleEdit(row.id)}
        pagination={{
          page,
          rowsPerPage,
          total: exercises.length,
        }}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />


      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Exercise?"
        message={`Are you sure you want to delete "${deleteTarget?.question ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </>
  );
}
