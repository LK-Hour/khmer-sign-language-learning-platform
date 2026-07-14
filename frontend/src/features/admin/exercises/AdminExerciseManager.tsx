"use client";

import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Publish from "@mui/icons-material/Publish";
import RestoreFromTrash from "@mui/icons-material/RestoreFromTrash";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslation } from "@/i18n/useTranslation";
import { ApiError } from "@/utils/api/client";

import * as adminApi from "../api/adminApi";
import type {
  AdminExercise,
  AdminExerciseOptionPayload,
  AdminLesson,
} from "../api/types";
import { EXERCISE_TYPES } from "../api/types";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import type { DataTableColumn } from "../components/shared/DataTable";
import StatusChip from "../components/shared/StatusChip";
import FormDialog from "../components/shared/FormDialog";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { useAdminTrack } from "../store/adminUi.store";

type OptionDraft = {
  id: number | null;
  option_text_en: string;
  option_text_kh: string;
  is_correct: boolean;
  order_index: number;
};

type FormState = {
  lesson_id: number | "";
  question_en: string;
  question_kh: string;
  exercise_type: string;
  correct_answer: string;
  order_index: number;
  options: OptionDraft[];
};

const emptyForm = (): FormState => ({
  lesson_id: "",
  question_en: "",
  question_kh: "",
  exercise_type: "multiple_choice",
  correct_answer: "",
  order_index: 1,
  options: [
    { id: null, option_text_en: "", option_text_kh: "", is_correct: true, order_index: 1 },
    { id: null, option_text_en: "", option_text_kh: "", is_correct: false, order_index: 2 },
  ],
});

const hasOptions = (exerciseType: string) =>
  exerciseType === "multiple_choice" ||
  exerciseType === "image_select" ||
  exerciseType === "matching";

export default function AdminExerciseManager() {
  const { t, entityActionLabel, quotedConfirmMessage } = useTranslation();
  const exerciseLabel = t("ADMIN.EXERCISE");

  const [track, setTrack] = useAdminTrack();
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<number>(0); // 0=All, 1=Draft, 2=Published
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminExercise | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [removedOptionIds, setRemovedOptionIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const [publishTarget, setPublishTarget] = useState<AdminExercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminExercise | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<AdminExercise | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [exerciseRows, lessonRows] = await Promise.all([
        adminApi.listExercises(track),
        adminApi.listLessons(track),
      ]);
      setExercises(exerciseRows);
      setLessons(lessonRows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("ADMIN.LOAD_FAILED"));
    } finally {
      setLoading(false);
    }
  }, [track, t]);

  useEffect(() => {
    void Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  useEffect(() => {
    void Promise.resolve().then(() => setPage(0));
  }, [track, search, statusFilter]);

  const lessonName = (lessonId: number) =>
    lessons.find((lesson) => lesson.id === lessonId)?.name_en ?? `#${lessonId}`;

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return exercises.filter((row) => {
      if (statusFilter === 1 && row.publish_status !== "draft") return false;
      if (statusFilter === 2 && row.publish_status !== "published") return false;
      if (
        needle &&
        !row.question_en.toLowerCase().includes(needle) &&
        !row.question_kh.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [exercises, search, statusFilter]);

  const pagedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setRemovedOptionIds([]);
    setFormOpen(true);
  };

  const openEdit = (exercise: AdminExercise) => {
    setEditing(exercise);
    setForm({
      lesson_id: exercise.lesson_id,
      question_en: exercise.question_en,
      question_kh: exercise.question_kh,
      exercise_type: exercise.exercise_type,
      correct_answer: exercise.correct_answer ?? "",
      order_index: exercise.order_index,
      options: exercise.options.map((option) => ({
        id: option.id,
        option_text_en: option.option_text_en ?? "",
        option_text_kh: option.option_text_kh ?? "",
        is_correct: option.is_correct,
        order_index: option.order_index,
      })),
    });
    setRemovedOptionIds([]);
    setFormOpen(true);
  };

  const runAction = async (action: () => Promise<unknown>, successNotice: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setNotice(successNotice);
      await loadAll();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("ADMIN.ACTION_FAILED"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    const exerciseBody = {
      lesson_id: Number(form.lesson_id),
      question_en: form.question_en,
      question_kh: form.question_kh,
      exercise_type: form.exercise_type,
      correct_answer: form.correct_answer || null,
      order_index: form.order_index,
    };

    const optionPayload = (option: OptionDraft): AdminExerciseOptionPayload => ({
      option_text_en: option.option_text_en || null,
      option_text_kh: option.option_text_kh || null,
      is_correct: option.is_correct,
      order_index: option.order_index,
    });

    const save = async () => {
      if (!editing) {
        return adminApi.createExercise(track, {
          ...exerciseBody,
          options: hasOptions(form.exercise_type) ? form.options.map(optionPayload) : [],
        });
      }

      await adminApi.updateExercise(track, editing.id, exerciseBody);
      if (hasOptions(form.exercise_type)) {
        for (const optionId of removedOptionIds) {
          await adminApi.deleteExerciseOption(track, optionId);
        }
        for (const option of form.options) {
          if (option.id === null) {
            await adminApi.createExerciseOption(track, editing.id, optionPayload(option));
          } else {
            await adminApi.updateExerciseOption(track, option.id, optionPayload(option));
          }
        }
      }
      return null;
    };

    const ok = await runAction(save, t("ADMIN.SAVED_AS_DRAFT_NOTE"));
    if (ok) setFormOpen(false);
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    const ok = await runAction(
      () => adminApi.publishExercise(track, publishTarget.id),
      t("ADMIN.PUBLISH_SUCCESS"),
    );
    if (ok) setPublishTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await runAction(
      () => adminApi.deleteExercise(track, deleteTarget.id),
      t("ADMIN.DELETE_SUCCESS"),
    );
    if (ok) setDeleteTarget(null);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    const ok = await runAction(
      () => adminApi.restoreExercise(track, restoreTarget.id),
      t("ADMIN.RESTORE_SUCCESS"),
    );
    if (ok) setRestoreTarget(null);
  };

  const updateOption = (index: number, patch: Partial<OptionDraft>) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index
          ? { ...option, ...patch }
          : patch.is_correct
            ? { ...option, is_correct: false }
            : option,
      ),
    }));
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          id: null,
          option_text_en: "",
          option_text_kh: "",
          is_correct: false,
          order_index: prev.options.length + 1,
        },
      ],
    }));
  };

  const removeOption = (index: number) => {
    const option = form.options[index];
    if (option?.id != null) {
      const removedId = option.id;
      setRemovedOptionIds((ids) => [...ids, removedId]);
    }
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  // DataTable columns
  const columns: DataTableColumn<AdminExercise>[] = useMemo(() => [
    {
      id: "question_en",
      label: t("ADMIN.CONTENT_PREVIEW"),
      render: (row) => (
        <Stack sx={{ opacity: row.is_active ? 1 : 0.55 }}>
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 700 }}>
            {row.question_en}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            {row.question_kh}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "exercise_type",
      label: t("ADMIN.TYPE"),
      render: (row) => (
        <Chip
          label={row.exercise_type.replace(/_/g, " ")}
          size="small"
          sx={{
            height: 22,
            fontSize: "0.6875rem",
            fontWeight: 700,
            textTransform: "uppercase",
            bgcolor: "rgba(12, 68, 174, 0.08)",
            color: "primary.main",
          }}
        />
      ),
    },
    {
      id: "lesson_id",
      label: t("ADMIN.LESSON"),
      render: (row) => (
        <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
          {lessonName(row.lesson_id)}
        </Typography>
      ),
    },
    {
      id: "status",
      label: t("ADMIN.STATUS"),
      sortable: false,
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <StatusChip variant={row.is_active ? "active" : "inactive"} />
          <StatusChip variant={row.publish_status === "published" ? "published" : "draft"} />
        </Stack>
      ),
    },
    {
      id: "actions",
      label: t("ADMIN.ACTIONS"),
      sortable: false,
      width: 140,
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t("BUTTON.EDIT")}>
            <IconButton size="small" onClick={() => openEdit(row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.is_active && row.publish_status === "draft" && (
            <Tooltip title={t("ADMIN.PUBLISH")}>
              <IconButton size="small" color="success" onClick={() => setPublishTarget(row)}>
                <Publish fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {row.is_active ? (
            <Tooltip title={t("BUTTON.DELETE")}>
              <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title={t("ADMIN.RESTORE")}>
              <IconButton size="small" color="success" onClick={() => setRestoreTarget(row)}>
                <RestoreFromTrash fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ], [t, lessons]);

  const filterTabs = [
    { label: t("ADMIN.FILTER_ALL"), count: exercises.length },
    { label: t("ADMIN.DRAFT") },
    { label: t("ADMIN.PUBLISHED") },
  ];

  return (
    <>
      <PageHeader
        title={t("ADMIN.EXERCISE_MANAGEMENT")}
        subtitle={`${t("ADMIN.MANAGEMENT")} / ${t("ADMIN.EXERCISES")}`}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            {entityActionLabel("ADMIN.ADD", exerciseLabel)}
          </Button>
        }
      />

      <Stack spacing={2}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {notice && (
          <Alert severity="info" onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}

        <ToggleButtonGroup
          exclusive
          size="small"
          value={track}
          onChange={(_, value) => value && setTrack(value)}
        >
          <ToggleButton value="finger" sx={{ fontWeight: 700 }}>
            {t("ADMIN.TRACK_FINGER")}
          </ToggleButton>
          <ToggleButton value="word_detection" sx={{ fontWeight: 700 }}>
            {t("ADMIN.TRACK_WORD_DETECTION")}
          </ToggleButton>
        </ToggleButtonGroup>

        <DataTable<AdminExercise>
          columns={columns}
          rows={pagedRows}
          loading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          filterTabs={filterTabs}
          activeFilterIndex={statusFilter}
          onFilterChange={setStatusFilter}
          pagination={{
            page,
            rowsPerPage,
            total: filteredRows.length,
          }}
          onPageChange={setPage}
          onRowsPerPageChange={(rpp) => {
            setRowsPerPage(rpp);
            setPage(0);
          }}
        />
      </Stack>

      {/* Create / Edit Exercise Form Dialog */}
      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          editing
            ? entityActionLabel("BUTTON.EDIT", exerciseLabel)
            : entityActionLabel("ADMIN.ADD", exerciseLabel)
        }
        subtitle={t("ADMIN.DRAFT_WORKFLOW_NOTE")}
        onSubmit={handleSave}
        loading={busy}
        submitLabel={t("ADMIN.SAVE_DRAFT")}
        cancelLabel={t("BUTTON.CANCEL")}
        sx={{ maxWidth: 720 }}
      >
        <TextField
          select
          required
          fullWidth
          label={t("ADMIN.LESSON")}
          value={form.lesson_id}
          onChange={(e) => setForm({ ...form, lesson_id: Number(e.target.value) })}
        >
          {lessons.map((lesson) => (
            <MenuItem key={lesson.id} value={lesson.id}>
              {lesson.name_en} · {lesson.name_kh}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          required
          fullWidth
          label={t("ADMIN.EXERCISE_TYPE")}
          value={form.exercise_type}
          onChange={(e) => setForm({ ...form, exercise_type: e.target.value })}
        >
          {EXERCISE_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type.replace(/_/g, " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          required
          fullWidth
          label={t("ADMIN.QUESTION_EN")}
          value={form.question_en}
          onChange={(e) => setForm({ ...form, question_en: e.target.value })}
        />
        <TextField
          required
          fullWidth
          label={t("ADMIN.QUESTION_KH")}
          value={form.question_kh}
          onChange={(e) => setForm({ ...form, question_kh: e.target.value })}
        />
        <TextField
          fullWidth
          label={t("ADMIN.CORRECT_ANSWER")}
          value={form.correct_answer}
          onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
        />
        <TextField
          type="number"
          label={t("ADMIN.SORT_ORDER")}
          value={form.order_index}
          onChange={(e) =>
            setForm({ ...form, order_index: Number.parseInt(e.target.value, 10) || 0 })
          }
        />

        {hasOptions(form.exercise_type) && (
          <Paper variant="outlined" sx={{ p: 2, gridColumn: "1 / -1" }}>
            <Stack spacing={1.5}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "text.secondary" }}>
                  {t("ADMIN.OPTIONS")}
                </Typography>
                <Button size="small" startIcon={<Add />} onClick={addOption}>
                  {t("ADMIN.ADD_OPTION")}
                </Button>
              </Stack>
              {form.options.map((option, index) => (
                <Stack
                  key={option.id ?? `new-${index}`}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ alignItems: { sm: "center" } }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={option.is_correct}
                        onChange={() => updateOption(index, { is_correct: true })}
                      />
                    }
                    label={t("ADMIN.IS_CORRECT")}
                    sx={{ minWidth: 120, ".MuiFormControlLabel-label": { fontSize: 12 } }}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label={`${t("ADMIN.OPTION_TEXT_EN")} ${index + 1}`}
                    value={option.option_text_en}
                    onChange={(e) => updateOption(index, { option_text_en: e.target.value })}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label={`${t("ADMIN.OPTION_TEXT_KH")} ${index + 1}`}
                    value={option.option_text_kh}
                    onChange={(e) => updateOption(index, { option_text_kh: e.target.value })}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeOption(index)}
                    disabled={form.options.length <= 2}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Paper>
        )}
      </FormDialog>

      {/* Publish Confirmation */}
      <ConfirmDialog
        open={publishTarget !== null}
        onClose={() => setPublishTarget(null)}
        onConfirm={handlePublish}
        title={t("ADMIN.PUBLISH")}
        message={quotedConfirmMessage(publishTarget?.question_en ?? "", "ADMIN.DELETE_CONFIRM_SUFFIX")}
        confirmLabel={t("ADMIN.PUBLISH")}
        loading={busy}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`${entityActionLabel("BUTTON.DELETE", exerciseLabel)}?`}
        message={quotedConfirmMessage(deleteTarget?.question_en ?? "", "ADMIN.DELETE_CONFIRM_SUFFIX")}
        confirmLabel={t("BUTTON.DELETE")}
        loading={busy}
      />

      {/* Restore Confirmation */}
      <ConfirmDialog
        open={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title={`${entityActionLabel("ADMIN.RESTORE", exerciseLabel)}?`}
        message={quotedConfirmMessage(restoreTarget?.question_en ?? "", "ADMIN.RESTORE_CONFIRM_SUFFIX")}
        confirmLabel={t("ADMIN.RESTORE")}
        loading={busy}
      />
    </>
  );
}
