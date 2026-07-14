"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Add from "@mui/icons-material/Add";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Box,
} from "@mui/material";
import PageHeader from "../components/shared/PageHeader";
import DataTable, { type DataTableColumn } from "../components/shared/DataTable";
import StatusChip from "../components/shared/StatusChip";
import FormDialog from "../components/shared/FormDialog";
import { listExercises } from "../api/adminApi";
import type { AdminExercise, AdminTrack, PublishStatus } from "../api/types";
import { ApiError } from "@/utils/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuizExercise {
  id: number;
  question: string;
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
    type: ex.exercise_type,
    options_count: ex.options?.length ?? 0,
    status: ex.publish_status,
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UnitQuizPage({ unitId, track }: UnitQuizPageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Data fetching state
  const [exercises, setExercises] = useState<QuizExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for new exercise
  const [formQuestion, setFormQuestion] = useState("");
  const [formType, setFormType] = useState("multiple_choice");

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

  const handleOpenDialog = useCallback(() => {
    setFormQuestion("");
    setFormType("multiple_choice");
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    // TODO: Wire to actual API call to create exercise for this unit
    handleCloseDialog();
  }, [handleCloseDialog]);

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
        width: 100,
        render: () => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton size="small">
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error">
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [],
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
            onClick={handleOpenDialog}
          >
            Add Exercise
          </Button>
        }
      />

      <DataTable<QuizExercise>
        columns={columns}
        rows={pagedRows}
        pagination={{
          page,
          rowsPerPage,
          total: exercises.length,
        }}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {/* Form Dialog for adding a new quiz exercise */}
      <FormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title="Add Exercise"
        subtitle={`Create a new quiz exercise for Unit ${unitId}`}
        onSubmit={handleSubmit}
        submitLabel="Create"
      >
        <TextField
          label="Question"
          value={formQuestion}
          onChange={(e) => setFormQuestion(e.target.value)}
          fullWidth
          required
          sx={{ gridColumn: "1 / -1" }}
        />
        <TextField
          select
          label="Type"
          value={formType}
          onChange={(e) => setFormType(e.target.value)}
          fullWidth
          slotProps={{ select: { native: true } }}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="image_select">Image Choice</option>
          <option value="free_form">Text Input</option>
          <option value="matching">Matching</option>
        </TextField>
      </FormDialog>
    </>
  );
}
