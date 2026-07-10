"use client";

import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import MenuBook from "@mui/icons-material/MenuBook";
import Publish from "@mui/icons-material/Publish";
import RestoreFromTrash from "@mui/icons-material/RestoreFromTrash";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminPageHeader,
  AdminTableFooter,
} from "../components/AdminTablePage";
import { ConfirmActionDialog, PublishConfirmDialog } from "../components/ConfirmDialogs";
import { ActiveChip, PublishChip } from "../components/StatusChips";
import { AdminColors, AdminFontSizes, adminTableHeaderSx } from "../components/adminTokens";
import { useAdminTrack } from "../store/adminUi.store";
import { KslColors, KslRadii } from "@/theme/theme";
import { color } from "framer-motion";

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
  const [lessonFilter, setLessonFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
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
  }, [track, search, lessonFilter, statusFilter]);

  const lessonName = (lessonId: number) =>
    lessons.find((lesson) => lesson.id === lessonId)?.name_en ?? `#${lessonId}`;

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return exercises.filter((row) => {
      if (lessonFilter !== "all" && row.lesson_id !== lessonFilter) return false;
      if (statusFilter !== "all" && row.publish_status !== statusFilter) return false;
      if (
        needle &&
        !row.question_en.toLowerCase().includes(needle) &&
        !row.question_kh.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [exercises, search, lessonFilter, statusFilter]);

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

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

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

  return (
    <>
      <AdminPageHeader
        eyebrow={`${t("ADMIN.MANAGEMENT")} / ${t("ADMIN.EXERCISES")}`}
        title={t("ADMIN.EXERCISE_MANAGEMENT")}
        icon={<MenuBook sx={{ fontSize: 24, color: AdminColors.primary }} />}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{borderRadius: KslRadii.showCard}}>
            {entityActionLabel("ADMIN.ADD", exerciseLabel)}
          </Button>
        }
      />

      <Stack sx={{ flex: 1, overflow: "auto", p: { xs: 2, md: 3 } }} spacing={2}>
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
          <ToggleButton value="finger" sx={{ fontSize: AdminFontSizes.small, fontWeight: 700, borderRadius: KslRadii.showCard }}>
            {t("ADMIN.TRACK_FINGER")}
          </ToggleButton>
          <ToggleButton
            value="word_detection"
            sx={{ fontSize: AdminFontSizes.small, fontWeight: 700, borderRadius: KslRadii.showCard}}
          >
            {t("ADMIN.TRACK_WORD_DETECTION")}
          </ToggleButton>
        </ToggleButtonGroup>

        <AdminFilterBar search={search} onSearchChange={setSearch}>
          <TextField
            select
            size="small"
            value={lessonFilter}
            onChange={(e) =>
              setLessonFilter(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            label={t("ADMIN.LESSON")}
            sx={{ minWidth: 200, bgcolor: "background.paper" }}
          >
            <MenuItem value="all">{t("ADMIN.FILTER_ALL")}</MenuItem>
            {lessons.map((lesson) => (
              <MenuItem key={lesson.id} value={lesson.id}>
                {lesson.name_en}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            label={t("ADMIN.FILTER_STATUS")}
            sx={{ minWidth: 160, bgcolor: "background.paper" }}
          >
            <MenuItem value="all">{t("ADMIN.FILTER_ALL")}</MenuItem>
            <MenuItem value="draft">{t("ADMIN.DRAFT")}</MenuItem>
            <MenuItem value="published">{t("ADMIN.PUBLISHED")}</MenuItem>
          </TextField>
        </AdminFilterBar>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: AdminColors.page }}>
                <TableCell align="center" sx={{ width: 64, ...adminTableHeaderSx }}>
                  {t("ADMIN.ORDER")}
                </TableCell>
                <TableCell sx={adminTableHeaderSx}>{t("ADMIN.CONTENT_PREVIEW")}</TableCell>
                <TableCell sx={adminTableHeaderSx}>{t("ADMIN.LESSON")}</TableCell>
                <TableCell sx={adminTableHeaderSx}>{t("ADMIN.TYPE")}</TableCell>
                <TableCell sx={adminTableHeaderSx}>{t("ADMIN.STATUS")}</TableCell>
                <TableCell align="right" sx={adminTableHeaderSx}>
                  {t("ADMIN.ACTIONS")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && pagedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <AdminEmptyState message={t("ADMIN.NO_RECORDS")} />
                  </TableCell>
                </TableRow>
              )}
              {pagedRows.map((row) => (
                <TableRow key={row.id} hover sx={{ opacity: row.is_active ? 1 : 0.55 }}>
                  <TableCell
                    align="center"
                    sx={{
                      fontFamily: "var(--font-app-mono)",
                      fontSize: AdminFontSizes.small,
                      color: AdminColors.sidebarMuted,
                    }}
                  >
                    {row.order_index}
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontSize: AdminFontSizes.body,
                        fontWeight: 700,
                        color: AdminColors.heading,
                      }}
                    >
                      {row.question_en}
                    </Typography>
                    <Typography
                      sx={{ mt: 0.5, fontSize: AdminFontSizes.small, color: AdminColors.muted }}
                    >
                      {row.question_kh}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: AdminFontSizes.small, color: AdminColors.muted }}>
                    {lessonName(row.lesson_id)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.exercise_type.replace(/_/g, " ")}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: AdminFontSizes.eyebrow,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        bgcolor: AdminColors.primaryTint,
                        color: AdminColors.primary,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75}>
                      <ActiveChip active={row.is_active} />
                      <PublishChip status={row.publish_status} />
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t("BUTTON.EDIT")}>
                      <IconButton size="small" onClick={() => openEdit(row)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {row.is_active && row.publish_status === "draft" && (
                      <Tooltip title={t("ADMIN.PUBLISH")}>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => setPublishTarget(row)}
                        >
                          <Publish fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {row.is_active ? (
                      <Tooltip title={t("BUTTON.DELETE")}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title={t("ADMIN.RESTORE")}>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => setRestoreTarget(row)}
                        >
                          <RestoreFromTrash fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminTableFooter
            count={filteredRows.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setPage(0);
            }}
          />
        </TableContainer>
      </Stack>

      {/* Create / edit exercise — saves as draft until published */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="md">
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>
            {editing
              ? entityActionLabel("BUTTON.EDIT", exerciseLabel)
              : entityActionLabel("ADMIN.ADD", exerciseLabel)}
          </Typography>
          <IconButton aria-label={t("ADMIN.CLOSE_DIALOG")} onClick={() => setFormOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: AdminColors.page }}>
          <Stack id="exerciseForm" component="form" onSubmit={handleSave} spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ fontSize: AdminFontSizes.small }}>
              {t("ADMIN.DRAFT_WORKFLOW_NOTE")}
            </Alert>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label={t("ADMIN.CORRECT_ANSWER")}
                value={form.correct_answer}
                onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                helperText={
                  form.exercise_type === "free_form"
                    ? t("ADMIN.TEXT_ANSWER_NOTE")
                    : undefined
                }
              />
              <TextField
                type="number"
                label={t("ADMIN.SORT_ORDER")}
                value={form.order_index}
                onChange={(e) =>
                  setForm({ ...form, order_index: Number.parseInt(e.target.value, 10) || 0 })
                }
                sx={{ width: 140 }}
              />
            </Stack>

            {hasOptions(form.exercise_type) && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", alignItems: "center" }}
                  >
                    <Typography
                      sx={{
                        fontSize: AdminFontSizes.small,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "text.secondary",
                      }}
                    >
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
                        onChange={(e) =>
                          updateOption(index, { option_text_en: e.target.value })
                        }
                      />
                      <TextField
                        size="small"
                        fullWidth
                        label={`${t("ADMIN.OPTION_TEXT_KH")} ${index + 1}`}
                        value={option.option_text_kh}
                        onChange={(e) =>
                          updateOption(index, { option_text_kh: e.target.value })
                        }
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={busy}  sx={{color: KslColors.muted, borderRadius: KslRadii.showCard} } >
            {t("BUTTON.CANCEL")}
          </Button>
          <Button type="submit" form="exerciseForm" variant="contained" disabled={busy} sx={{borderRadious: KslRadii.showCard}}>
            {t("ADMIN.SAVE_DRAFT")}
          </Button>
        </DialogActions>
      </Dialog>

      <PublishConfirmDialog
        open={publishTarget !== null}
        entityLabel={t("ADMIN.EXERCISE")}
        nameEn={publishTarget?.question_en ?? ""}
        nameKh={publishTarget?.question_kh}
        isActive={publishTarget?.is_active ?? true}
        busy={busy}
        onClose={() => setPublishTarget(null)}
        onConfirm={handlePublish}
      />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        title={`${entityActionLabel("BUTTON.DELETE", exerciseLabel)}?`}
        message={quotedConfirmMessage(
          deleteTarget?.question_en ?? "",
          "ADMIN.DELETE_CONFIRM_SUFFIX",
        )}
        confirmLabel={t("BUTTON.DELETE")}
        confirmColor="error"
        busy={busy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ConfirmActionDialog
        open={restoreTarget !== null}
        title={`${entityActionLabel("ADMIN.RESTORE", exerciseLabel)}?`}
        message={quotedConfirmMessage(
          restoreTarget?.question_en ?? "",
          "ADMIN.RESTORE_CONFIRM_SUFFIX",
        )}
        confirmLabel={t("ADMIN.RESTORE")}
        confirmColor="success"
        busy={busy}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
      />
    </>
  );
}
