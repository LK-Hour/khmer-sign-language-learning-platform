"use client";

import Add from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import Close from "@mui/icons-material/Close";
import Edit from "@mui/icons-material/Edit";
import ErrorOutline from "@mui/icons-material/ErrorOutlineOutlined";
import ImageIcon from "@mui/icons-material/Image";
import Publish from "@mui/icons-material/Publish";
import TextFields from "@mui/icons-material/TextFields";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Radio,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/translations";
import { ApiError } from "@/utils/api/client";
import * as adminApi from "../api/adminApi";
import type { AdminExercise, AdminExerciseOptionPayload } from "../api/types";
import { useAdminTrack } from "../store/adminUi.store";
import type { AdminQuizQuestionType } from "./types";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import type { DataTableColumn } from "../components/shared/DataTable";
import StatusChip from "../components/shared/StatusChip";

function typeLabelKey(type: AdminQuizQuestionType): TranslationKey {
  if (type === "MULTIPLE_CHOICE") return "ADMIN.MULTIPLE_CHOICE";
  if (type === "IMAGE_CHOICE") return "ADMIN.IMAGE_CHOICE";
  return "ADMIN.TEXT_INPUT";
}

function typeChipStyles(type: AdminQuizQuestionType) {
  if (type === "MULTIPLE_CHOICE") {
    return { bgcolor: "rgba(79, 70, 229, 0.08)", color: "#4f46e5" };
  }
  if (type === "IMAGE_CHOICE") {
    return { bgcolor: "rgba(217, 119, 6, 0.08)", color: "#d97706" };
  }
  return { bgcolor: "rgba(5, 150, 105, 0.08)", color: "#059669" };
}

const TYPE_OPTIONS: AdminQuizQuestionType[] = [
  "MULTIPLE_CHOICE",
  "IMAGE_CHOICE",
  "TEXT_INPUT",
];

/** Map backend exercise_type to quiz question type */
function toQuizType(exerciseType: string): AdminQuizQuestionType {
  if (exerciseType === "multiple_choice") return "MULTIPLE_CHOICE";
  if (exerciseType === "image_select") return "IMAGE_CHOICE";
  return "TEXT_INPUT";
}

/** Map quiz question type to backend exercise_type */
function toExerciseType(quizType: AdminQuizQuestionType): string {
  if (quizType === "MULTIPLE_CHOICE") return "multiple_choice";
  if (quizType === "IMAGE_CHOICE") return "image_select";
  return "free_form";
}

interface QuizFormData {
  lesson_id: number | "";
  type: AdminQuizQuestionType;
  prompt: string;
  prompt_kh: string;
  image_url: string;
  options: string[];
  correct_answer: string;
  order_index: number;
  is_active: boolean;
}

const emptyForm = (orderIndex: number): QuizFormData => ({
  lesson_id: "",
  type: "MULTIPLE_CHOICE",
  prompt: "",
  prompt_kh: "",
  image_url: "",
  options: ["", "", "", ""],
  correct_answer: "",
  order_index: orderIndex,
  is_active: true,
});

export default function AdminQuizManager() {
  const { t, locale } = useTranslation();
  const [track] = useAdminTrack();
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<number>(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<QuizFormData>(() => emptyForm(1));

  // Fetch exercises from the API
  const loadExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listExercises(track);
      setExercises(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("ADMIN.LOAD_FAILED"));
    } finally {
      setLoading(false);
    }
  }, [track, t]);

  useEffect(() => {
    void loadExercises();
  }, [loadExercises]);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  const filteredExercises = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return exercises
      .filter((row) => {
        if (statusFilter === 1 && row.publish_status !== "draft") return false;
        if (statusFilter === 2 && row.publish_status !== "published") return false;
        if (statusFilter === 3 && !row.is_active) return false;
        if (statusFilter === 4 && row.is_active) return false;
        if (
          needle &&
          !row.question_en.toLowerCase().includes(needle) &&
          !row.question_kh.toLowerCase().includes(needle)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.order_index - b.order_index);
  }, [exercises, search, statusFilter]);

  const pagedRows = useMemo(
    () => filteredExercises.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filteredExercises, page, rowsPerPage],
  );

  const handleTypeChange = (newType: AdminQuizQuestionType | null) => {
    if (!newType) return;
    setFormData((prev) => ({
      ...prev,
      type: newType,
      options:
        newType === "MULTIPLE_CHOICE"
          ? ["", "", "", ""]
          : newType === "IMAGE_CHOICE"
            ? ["", ""]
            : [],
      correct_answer: "",
      image_url: newType === "IMAGE_CHOICE" ? "" : prev.image_url,
    }));
  };

  const openCreateModal = () => {
    setFormData(emptyForm(exercises.length + 1));
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (exercise: AdminExercise) => {
    const quizType = toQuizType(exercise.exercise_type);
    setFormData({
      lesson_id: exercise.lesson_id,
      type: quizType,
      prompt: exercise.question_en,
      prompt_kh: exercise.question_kh,
      image_url: "",
      options: exercise.options.map(
        (opt) => opt.option_text_en ?? opt.option_text_kh ?? ""
      ),
      correct_answer:
        exercise.correct_answer ??
        exercise.options.find((opt) => opt.is_correct)?.option_text_en ??
        "",
      order_index: exercise.order_index,
      is_active: exercise.is_active,
    });
    setEditingId(exercise.id);
    setIsModalOpen(true);
  };

  const runAction = async (action: () => Promise<unknown>, successNotice: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setNotice(successNotice);
      await loadExercises();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("ADMIN.ACTION_FAILED"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (exercise: AdminExercise) => {
    if (exercise.is_active) {
      await runAction(
        () => adminApi.deleteExercise(track, exercise.id),
        t("ADMIN.DELETE_SUCCESS")
      );
    } else {
      await runAction(
        () => adminApi.restoreExercise(track, exercise.id),
        t("ADMIN.RESTORE_SUCCESS")
      );
    }
  };

  const handlePublish = async (exercise: AdminExercise) => {
    await runAction(
      () => adminApi.publishExercise(track, exercise.id),
      t("ADMIN.PUBLISH_SUCCESS")
    );
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      const newCorrectAnswer =
        prev.correct_answer === prev.options[index] ? value : prev.correct_answer;
      return { ...prev, options: newOptions, correct_answer: newCorrectAnswer };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type !== "TEXT_INPUT") {
      if (!formData.correct_answer || !formData.options.includes(formData.correct_answer)) {
        window.alert(t("ADMIN.INVALID_CORRECT_ANSWER"));
        return;
      }
    } else if (!formData.correct_answer.trim()) {
      window.alert(t("ADMIN.MISSING_TEXT_ANSWER"));
      return;
    }

    const exercisePayload = {
      lesson_id: Number(formData.lesson_id) || 0,
      question_en: formData.prompt,
      question_kh: formData.prompt_kh,
      exercise_type: toExerciseType(formData.type),
      correct_answer: formData.correct_answer || null,
      order_index: formData.order_index,
      options: formData.options
        .filter((opt) => opt.trim() !== "")
        .map((opt, idx) => ({
          option_text_en: opt,
          is_correct: opt === formData.correct_answer,
          order_index: idx + 1,
        } as AdminExerciseOptionPayload)),
    };

    const save = async () => {
      if (editingId) {
        const { options, ...updateBody } = exercisePayload;
        await adminApi.updateExercise(track, editingId, updateBody);
      } else {
        await adminApi.createExercise(track, exercisePayload);
      }
    };

    const ok = await runAction(save, t("ADMIN.SAVED_AS_DRAFT_NOTE"));
    if (ok) setIsModalOpen(false);
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
          <Typography sx={{ fontSize: "0.75rem", fontStyle: "italic", color: "text.secondary" }}>
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
          label={t(typeLabelKey(toQuizType(row.exercise_type)))}
          size="small"
          sx={{
            ...typeChipStyles(toQuizType(row.exercise_type)),
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
      label: "Questions",
      render: (row) => row.options.length,
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
          <Tooltip title={t("ADMIN.EDIT_QUESTION_ARIA")}>
            <IconButton size="small" onClick={() => openEditModal(row)} disabled={busy}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.is_active && row.publish_status === "draft" && (
            <Tooltip title={t("ADMIN.PUBLISH")}>
              <IconButton
                size="small"
                color="success"
                onClick={() => void handlePublish(row)}
                disabled={busy}
              >
                <Publish fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={row.is_active ? t("ADMIN.DEACTIVATE_QUESTION") : t("ADMIN.ACTIVATE_QUESTION")}>
            <IconButton
              size="small"
              color={row.is_active ? "error" : "success"}
              onClick={() => void handleToggleActive(row)}
              disabled={busy}
            >
              {row.is_active ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], [t, busy]);

  const filterTabs = [
    { label: t("ADMIN.FILTER_ALL"), count: exercises.length },
    { label: t("ADMIN.DRAFT") },
    { label: t("ADMIN.PUBLISHED") },
    { label: t("ADMIN.ACTIVE") },
    { label: t("ADMIN.INACTIVE") },
  ];

  const sectionLabelSx = {
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
  } as const;

  return (
    <>
      <PageHeader
        title={t("ADMIN.QUIZ_MANAGEMENT")}
        subtitle={track === "finger" ? "Finger Spelling" : "Word Detection"}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreateModal} disabled={busy}>
            {t("ADMIN.ADD_QUESTION")}
          </Button>
        }
      />

      <Stack spacing={2}>
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            action={
              <Button color="inherit" size="small" onClick={() => void loadExercises()}>
                {t("BUTTON.TRY_AGAIN")}
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        {notice && (
          <Alert severity="info" onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}

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
            total: filteredExercises.length,
          }}
          onPageChange={setPage}
          onRowsPerPageChange={(rpp) => {
            setRowsPerPage(rpp);
            setPage(0);
          }}
        />
      </Stack>

      {/* Quiz Create/Edit Dialog — kept as full custom dialog due to complex form */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: "16px" } }, backdrop: { sx: { backgroundColor: "rgba(28, 37, 46, 0.5)" } } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
          <Stack>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingId ? t("ADMIN.EDIT_QUESTION") : t("ADMIN.ADD_NEW_QUESTION")}
            </Typography>
            <Typography sx={{ ...sectionLabelSx, color: "text.secondary" }}>
              {locale === "kh"
                ? `${t("PHRASES.INTERACTION_MODE")} ${t(typeLabelKey(formData.type))}`
                : `${t(typeLabelKey(formData.type))} ${t("PHRASES.INTERACTION_MODE")}`}
            </Typography>
          </Stack>
          <IconButton aria-label={t("ADMIN.CLOSE_DIALOG")} onClick={() => setIsModalOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack id="quizForm" component="form" onSubmit={handleSave} spacing={3}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography sx={{ mb: 1.5, textAlign: "center", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "text.secondary" }}>
                {t("ADMIN.SELECT_QUIZ_TYPE")}
              </Typography>
              <ToggleButtonGroup exclusive fullWidth value={formData.type} onChange={(_, value) => handleTypeChange(value)}>
                {TYPE_OPTIONS.map((type) => (
                  <ToggleButton key={type} value={type} sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                    {t(typeLabelKey(type))}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
                  <TextFields sx={{ fontSize: 16 }} />
                  <Typography sx={sectionLabelSx}>{t("ADMIN.QUESTION_PROMPT")}</Typography>
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField required fullWidth label={t("ADMIN.TITLE_EN")} value={formData.prompt} onChange={(e) => setFormData({ ...formData, prompt: e.target.value })} />
                  <TextField fullWidth label={t("ADMIN.TITLE_KH")} value={formData.prompt_kh} onChange={(e) => setFormData({ ...formData, prompt_kh: e.target.value })} placeholder={t("ADMIN.TITLE_KH_PLACEHOLDER")} />
                </Stack>
              </Stack>
            </Paper>

            {(formData.type === "MULTIPLE_CHOICE" || formData.type === "TEXT_INPUT") && (
              <Paper variant="outlined" sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
                    <ImageIcon sx={{ fontSize: 16 }} />
                    <Typography sx={sectionLabelSx}>{t("ADMIN.QUESTION_VISUAL")}</Typography>
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
                    <TextField required fullWidth type="url" label={t("ADMIN.QUESTION_IMAGE_URL")} value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder={t("ADMIN.IMAGE_URL_PLACEHOLDER")} />
                    {formData.image_url && (
                      <Box component="img" src={formData.image_url} alt="" sx={{ width: 96, height: 56, objectFit: "cover", borderRadius: 1, border: "1px solid", borderColor: "divider" }} />
                    )}
                  </Stack>
                </Stack>
              </Paper>
            )}

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", pb: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "primary.main" }}>
                    <Check sx={{ fontSize: 18 }} />
                    <Typography sx={sectionLabelSx}>{t("ADMIN.ANSWER_CONFIG")}</Typography>
                  </Stack>
                  {formData.type !== "TEXT_INPUT" && (
                    <Chip label={t("ADMIN.CHOOSE_CORRECT_OPTION")} size="small" />
                  )}
                </Stack>

                {formData.type === "MULTIPLE_CHOICE" && (
                  <Grid container spacing={1.5}>
                    {formData.options.map((opt, idx) => {
                      const selected = formData.correct_answer === opt && opt !== "";
                      return (
                        <Grid key={idx} size={{ xs: 12, md: 6 }}>
                          <Paper variant="outlined" sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5, borderColor: selected ? "primary.light" : "divider", bgcolor: selected ? "rgba(12, 68, 174, 0.04)" : "background.default" }}>
                            <Radio name="correct_answer" required checked={selected} onChange={() => setFormData({ ...formData, correct_answer: opt })} />
                            <TextField required fullWidth variant="standard" placeholder={`${t("PHRASES.CHOICE")} ${idx + 1}`} value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} />
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}

                {formData.type === "IMAGE_CHOICE" && (
                  <Stack spacing={2}>
                    {formData.options.map((opt, idx) => {
                      const selected = formData.correct_answer === opt && opt !== "";
                      return (
                        <Paper key={idx} variant="outlined" sx={{ p: 2, borderColor: selected ? "primary.light" : "divider", bgcolor: selected ? "rgba(12, 68, 174, 0.04)" : "background.default" }}>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
                            <Stack sx={{ alignItems: "center" }}>
                              <Typography sx={{ mb: 0.5, fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", color: "text.secondary" }}>{t("ADMIN.CORRECT_QUESTION")}</Typography>
                              <Radio name="correct_answer" required checked={selected} onChange={() => setFormData({ ...formData, correct_answer: opt })} />
                            </Stack>
                            <TextField required fullWidth type="url" label={`${t("PHRASES.OPTION_IMAGE_URL")} ${idx + 1}`} placeholder={t("ADMIN.ENTER_IMAGE_URL")} value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} />
                            {opt ? (
                              <Box component="img" src={opt} alt="" sx={{ width: 96, height: 56, objectFit: "cover", borderRadius: 1, border: "1px solid", borderColor: "divider" }} />
                            ) : (
                              <Box sx={{ width: 96, height: 56, display: "grid", placeItems: "center", borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", color: "text.disabled" }}>
                                <ImageIcon sx={{ fontSize: 18 }} />
                              </Box>
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}

                {formData.type === "TEXT_INPUT" && (
                  <Paper variant="outlined" sx={{ p: 2, borderColor: "success.light", bgcolor: "rgba(34, 197, 94, 0.04)" }}>
                    <TextField required fullWidth label={t("ADMIN.TARGET_ANSWER")} value={formData.correct_answer} onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })} placeholder={t("ADMIN.TARGET_ANSWER_PLACEHOLDER")} />
                    <Typography sx={{ mt: 1, fontSize: "0.6875rem", fontStyle: "italic", color: "success.dark" }}>{t("ADMIN.TEXT_ANSWER_NOTE")}</Typography>
                  </Paper>
                )}

                {!formData.correct_answer && (
                  <Alert icon={<ErrorOutline fontSize="inherit" />} severity="warning">{t("ADMIN.VALIDATION_CORRECT_ANSWER")}</Alert>
                )}
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
                <FormControlLabel
                  control={<Checkbox checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />}
                  label={t("ADMIN.PUBLISHED_ACTIVE")}
                />
                <TextField
                  type="number"
                  label={t("ADMIN.SORT_ORDER")}
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: Number.parseInt(e.target.value, 10) || 1 })}
                  sx={{ width: { xs: "100%", md: 140 } }}
                />
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsModalOpen(false)} disabled={busy}>{t("BUTTON.CANCEL")}</Button>
          <Button type="submit" form="quizForm" variant="contained" startIcon={<Check />} disabled={busy}>
            {editingId ? t("ADMIN.UPDATE_QUESTION") : t("ADMIN.ADD_QUESTION")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
