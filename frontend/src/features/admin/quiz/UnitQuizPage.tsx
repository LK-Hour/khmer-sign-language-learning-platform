"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Add from "@mui/icons-material/Add";
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
import PreviewDrawer from "../components/shared/PreviewDrawer";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { listExercises, deleteExercise } from "../api/adminApi";
import type { AdminExercise, AdminTrack, PublishStatus } from "../api/types";
import { ApiError } from "@/utils/api/client";

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

function typeChipColor(type: string) {
  switch (type) {
    case "multiple_choice":
      return { bgcolor: "rgba(79, 70, 229, 0.08)", color: "#4f46e5" };
    case "image_select":
      return { bgcolor: "rgba(217, 119, 6, 0.08)", color: "#d97706" };
    case "matching":
      return { bgcolor: "rgba(236, 72, 153, 0.08)", color: "#ec4899" };
    default:
      return { bgcolor: "rgba(5, 150, 105, 0.08)", color: "#059669" };
  }
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Data fetching state
  const [exercises, setExercises] = useState<QuizExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [previewItem, setPreviewItem] = useState<QuizExercise | null>(null);
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
    router.push(`/admin/learning/quiz/${trackSegment}/exercises/create`);
  }, [router, trackSegment]);

  const handleEdit = useCallback((exerciseId: number) => {
    router.push(`/admin/learning/quiz/${trackSegment}/exercises/${exerciseId}/edit`);
  }, [router, trackSegment]);

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
            sx={{
              ...typeChipColor(row.type),
              height: 22,
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
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
            onPreview={() => setPreviewItem(row)}
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

      {/* Preview drawer */}
      <PreviewDrawer
        open={previewItem !== null}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.question ?? ""}
        subtitle={previewItem?.question_kh}
        fields={
          previewItem
            ? [
                { label: "ID", value: previewItem.id },
                { label: "Type", value: typeLabel(previewItem.type) },
                { label: "Options", value: previewItem.options_count },
                {
                  label: "Status",
                  value: <StatusChip variant={previewItem.status} />,
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
        title="Delete Exercise?"
        message={`Are you sure you want to delete "${deleteTarget?.question ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </>
  );
}
