"use client";

import Add from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import Close from "@mui/icons-material/Close";
import Edit from "@mui/icons-material/Edit";
import ErrorOutline from "@mui/icons-material/ErrorOutlineOutlined";
import FormatListNumbered from "@mui/icons-material/FormatListNumbered";
import ImageIcon from "@mui/icons-material/Image";
import Layers from "@mui/icons-material/Layers";
import MenuBook from "@mui/icons-material/MenuBook";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/translations";
import { INITIAL_QUESTIONS, MOCK_CONTEXT } from "./mockData";
import type { AdminQuizQuestion, AdminQuizQuestionType } from "./types";

const AdminQuizColors = {
  page: "#f8fafc",
  sidebar: "#0f172a",
  sidebarStrong: "#020617",
  sidebarBorder: "#1e293b",
  sidebarText: "#cbd5e1",
  sidebarMuted: "#94a3b8",
  muted: "#64748b",
  heading: "#1e293b",
  border: "#e2e8f0",
  softBorder: "#f1f5f9",
  primary: "#2563eb",
  primaryText: "#60a5fa",
  primaryTint: "rgba(37,99,235,0.1)",
  primaryTintBorder: "rgba(37,99,235,0.2)",
  primaryTintHover: "rgba(37,99,235,0.16)",
  multipleChoiceBg: "#eef2ff",
  multipleChoiceText: "#4f46e5",
  imageChoiceBg: "#fff7ed",
  imageChoiceText: "#d97706",
  textInputBg: "#ecfdf5",
  textInputText: "#059669",
  textInputBorder: "#a7f3d0",
  selectedBg: "#f3f9ff",
} as const;

const AdminQuizFontSizes = {
  eyebrow: 10,
  caption: 11,
  small: 12,
  body: 14,
} as const;

const sectionLabelSx = {
  fontSize: AdminQuizFontSizes.small,
  fontWeight: 700,
  textTransform: "uppercase",
} as const;

const tableHeaderSx = {
  fontSize: AdminQuizFontSizes.eyebrow,
  fontWeight: 700,
  textTransform: "uppercase",
  color: AdminQuizColors.muted,
} as const;

function typeLabelKey(type: AdminQuizQuestionType): TranslationKey {
  if (type === "MULTIPLE_CHOICE") return "ADMIN.MULTIPLE_CHOICE";
  if (type === "IMAGE_CHOICE") return "ADMIN.IMAGE_CHOICE";
  return "ADMIN.TEXT_INPUT";
}

function typeChipStyles(type: AdminQuizQuestionType) {
  if (type === "MULTIPLE_CHOICE") {
    return {
      bgcolor: AdminQuizColors.multipleChoiceBg,
      color: AdminQuizColors.multipleChoiceText,
    };
  }
  if (type === "IMAGE_CHOICE") {
    return {
      bgcolor: AdminQuizColors.imageChoiceBg,
      color: AdminQuizColors.imageChoiceText,
    };
  }
  return {
    bgcolor: AdminQuizColors.textInputBg,
    color: AdminQuizColors.textInputText,
  };
}

const TYPE_OPTIONS: AdminQuizQuestionType[] = [
  "MULTIPLE_CHOICE",
  "IMAGE_CHOICE",
  "TEXT_INPUT",
];

const emptyQuestion = (orderIndex: number): AdminQuizQuestion => ({
  id: "",
  chapter_id: MOCK_CONTEXT.chapter.id,
  lesson_id: MOCK_CONTEXT.lessons[0]?.id ?? null,
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
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<AdminQuizQuestion[]>(
    () => INITIAL_QUESTIONS
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminQuizQuestion>(() =>
    emptyQuestion(1)
  );

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order_index - b.order_index),
    [questions]
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
    setFormData(emptyQuestion(questions.length + 1));
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (question: AdminQuizQuestion) => {
    setFormData({ ...question });
    setEditingId(question.id);
    setIsModalOpen(true);
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, is_active: !currentStatus } : q))
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type !== "TEXT_INPUT") {
      if (
        !formData.correct_answer ||
        !formData.options.includes(formData.correct_answer)
      ) {
        window.alert(t("ADMIN.INVALID_CORRECT_ANSWER"));
        return;
      }
    } else if (!formData.correct_answer.trim()) {
      window.alert(t("ADMIN.MISSING_TEXT_ANSWER"));
      return;
    }

    if (editingId) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingId ? { ...formData, id: editingId } : q
        )
      );
    } else {
      setQuestions((prev) => [
        ...prev,
        { ...formData, id: `q${Date.now()}` },
      ]);
    }
    setIsModalOpen(false);
  };

  return (
    <Stack direction="row" sx={{ minHeight: "100vh", bgcolor: AdminQuizColors.page }}>
      <Stack
        component="aside"
        sx={{
          display: { xs: "none", md: "flex" },
          width: 256,
          flexShrink: 0,
          bgcolor: AdminQuizColors.sidebar,
          color: AdminQuizColors.sidebarText,
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            p: 2,
            borderBottom: `1px solid ${AdminQuizColors.sidebarBorder}`,
            bgcolor: AdminQuizColors.sidebarStrong,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              display: "grid",
              placeItems: "center",
              bgcolor: AdminQuizColors.primary,
              color: "common.white",
              fontWeight: 700,
            }}
          >
            K
          </Box>
          <Stack>
            <Typography sx={{ fontSize: AdminQuizFontSizes.body, fontWeight: 700, color: "common.white", lineHeight: 1 }}>
              KSL Admin
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: AdminQuizFontSizes.eyebrow, textTransform: "uppercase", color: AdminQuizColors.muted }}>
              {t("ADMIN.MANAGEMENT")}
            </Typography>
          </Stack>
        </Stack>

        <Stack component="nav" spacing={1} sx={{ flex: 1, p: 2 }}>
          <Typography sx={{ px: 1, mb: 1, fontSize: AdminQuizFontSizes.eyebrow, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: AdminQuizColors.muted }}>
            {t("ADMIN.NAVIGATION")}
          </Typography>
          <Button
            startIcon={<Layers sx={{ fontSize: 18 }} />}
            sx={{
              justifyContent: "flex-start",
              color: AdminQuizColors.primaryText,
              bgcolor: AdminQuizColors.primaryTint,
              border: `1px solid ${AdminQuizColors.primaryTintBorder}`,
              "&:hover": { bgcolor: AdminQuizColors.primaryTintHover },
            }}
          >
            {t("ADMIN.CURRICULUM")}
          </Button>
          <Button
            startIcon={<MenuBook sx={{ fontSize: 18 }} />}
            sx={{
              justifyContent: "flex-start",
              color: AdminQuizColors.sidebarMuted,
              "&:hover": { bgcolor: AdminQuizColors.sidebarBorder, color: "common.white" },
            }}
          >
            {t("ADMIN.EXERCISES")}
          </Button>
        </Stack>
      </Stack>

      <Stack component="main" sx={{ flex: 1, minWidth: 0 }}>
        <Paper square elevation={0} sx={{ zIndex: 1, p: 2, borderBottom: `1px solid ${AdminQuizColors.border}` }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {[MOCK_CONTEXT.track, MOCK_CONTEXT.unit.title, MOCK_CONTEXT.chapter.title].map(
                (item, index) => (
                  <Stack key={item} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    {index > 0 && <Typography sx={{ color: AdminQuizColors.sidebarText }}>/</Typography>}
                    <Typography sx={{ fontSize: AdminQuizFontSizes.small, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: AdminQuizColors.sidebarMuted }}>
                      {item}
                    </Typography>
                  </Stack>
                )
              )}
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" } }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <FormatListNumbered sx={{ fontSize: 24, color: AdminQuizColors.primary }} />
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: AdminQuizColors.heading }}>
                  {t("ADMIN.QUIZ_MANAGEMENT")}
                </Typography>
              </Stack>
              <Button variant="contained" startIcon={<Add />} onClick={openCreateModal}>
                {t("ADMIN.ADD_QUESTION")}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Stack sx={{ flex: 1, overflow: "auto", p: { xs: 2, md: 3 } }}>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: AdminQuizColors.page }}>
                  <TableCell align="center" sx={{ width: 64, ...tableHeaderSx }}>
                    {t("ADMIN.ORDER")}
                  </TableCell>
                  <TableCell sx={tableHeaderSx}>
                    {t("ADMIN.CONTENT_PREVIEW")}
                  </TableCell>
                  <TableCell sx={tableHeaderSx}>
                    {t("ADMIN.TYPE")}
                  </TableCell>
                  <TableCell sx={tableHeaderSx}>
                    {t("ADMIN.STATUS")}
                  </TableCell>
                  <TableCell align="right" sx={tableHeaderSx}>
                    {t("ADMIN.ACTIONS")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedQuestions.map((q) => (
                  <TableRow key={q.id} hover sx={{ opacity: q.is_active ? 1 : 0.55 }}>
                    <TableCell align="center" sx={{ fontFamily: "var(--font-app-mono)", fontSize: AdminQuizFontSizes.small, color: AdminQuizColors.sidebarMuted }}>
                      {q.order_index}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: AdminQuizFontSizes.body, fontWeight: 700, color: AdminQuizColors.heading }}>
                        {q.prompt}
                      </Typography>
                      <Typography sx={{ mt: 0.5, fontSize: AdminQuizFontSizes.small, fontStyle: "italic", color: AdminQuizColors.muted }}>
                        {q.correct_answer && q.type === "TEXT_INPUT"
                          ? t("ADMIN.ANSWER", { answer: q.correct_answer })
                          : q.prompt_kh}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(typeLabelKey(q.type))}
                        size="small"
                        sx={{ ...typeChipStyles(q.type), height: 22, fontSize: AdminQuizFontSizes.eyebrow, fontWeight: 700, textTransform: "uppercase" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={q.is_active ? t("ADMIN.ACTIVE") : t("ADMIN.INACTIVE")}
                        size="small"
                        color={q.is_active ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton aria-label={t("ADMIN.EDIT_QUESTION_ARIA")} onClick={() => openEditModal(q)} size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={
                          q.is_active
                            ? t("ADMIN.DEACTIVATE_QUESTION")
                            : t("ADMIN.ACTIVATE_QUESTION")
                        }
                        onClick={() => handleToggleActive(q.id, q.is_active)}
                        size="small"
                        color={q.is_active ? "error" : "success"}
                      >
                        {q.is_active ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Stack>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
          <Stack>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingId ? t("ADMIN.EDIT_QUESTION") : t("ADMIN.ADD_NEW_QUESTION")}
            </Typography>
            <Typography sx={{ ...sectionLabelSx, color: "text.secondary" }}>
              {t("ADMIN.INTERACTION_MODE", { type: t(typeLabelKey(formData.type)) })}
            </Typography>
          </Stack>
          <IconButton aria-label={t("ADMIN.CLOSE_DIALOG")} onClick={() => setIsModalOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: AdminQuizColors.page }}>
          <Stack id="quizForm" component="form" onSubmit={handleSave} spacing={3}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography sx={{ mb: 1.5, textAlign: "center", fontSize: AdminQuizFontSizes.caption, fontWeight: 700, textTransform: "uppercase", color: "text.secondary" }}>
                {t("ADMIN.SELECT_QUIZ_TYPE")}
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={formData.type}
                onChange={(_, value) => handleTypeChange(value)}
              >
                {TYPE_OPTIONS.map((type) => (
                  <ToggleButton key={type} value={type} sx={{ fontSize: AdminQuizFontSizes.small, fontWeight: 700 }}>
                    {t(typeLabelKey(type))}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
                  <TextFields sx={{ fontSize: 16 }} />
                  <Typography sx={sectionLabelSx}>
                    {t("ADMIN.QUESTION_PROMPT")}
                  </Typography>
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    required
                    fullWidth
                    label={t("ADMIN.TITLE_EN")}
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label={t("ADMIN.TITLE_KH")}
                    value={formData.prompt_kh}
                    onChange={(e) => setFormData({ ...formData, prompt_kh: e.target.value })}
                    placeholder={t("ADMIN.TITLE_KH_PLACEHOLDER")}
                  />
                </Stack>
              </Stack>
            </Paper>

            {(formData.type === "MULTIPLE_CHOICE" || formData.type === "TEXT_INPUT") && (
              <Paper variant="outlined" sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
                    <ImageIcon sx={{ fontSize: 16 }} />
                    <Typography sx={sectionLabelSx}>
                      {t("ADMIN.QUESTION_VISUAL")}
                    </Typography>
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
                    <TextField
                      required
                      fullWidth
                      type="url"
                      label={t("ADMIN.QUESTION_IMAGE_URL")}
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder={t("ADMIN.IMAGE_URL_PLACEHOLDER")}
                    />
                    {formData.image_url && (
                      <Box
                        component="img"
                        src={formData.image_url}
                        alt=""
                        sx={{
                          width: 96,
                          height: 56,
                          objectFit: "cover",
                          borderRadius: 1,
                          border: `1px solid ${AdminQuizColors.border}`,
                          bgcolor: AdminQuizColors.softBorder,
                        }}
                      />
                    )}
                  </Stack>
                </Stack>
              </Paper>
            )}

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    pb: 1,
                    borderBottom: `1px solid ${AdminQuizColors.softBorder}`,
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "primary.main" }}>
                    <Check sx={{ fontSize: 18 }} />
                    <Typography sx={sectionLabelSx}>
                      {t("ADMIN.ANSWER_CONFIG")}
                    </Typography>
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
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              borderColor: selected ? "primary.light" : AdminQuizColors.softBorder,
                              bgcolor: selected ? AdminQuizColors.selectedBg : AdminQuizColors.page,
                            }}
                          >
                            <Radio
                              name="correct_answer"
                              required
                              checked={selected}
                              onChange={() => setFormData({ ...formData, correct_answer: opt })}
                            />
                            <TextField
                              required
                              fullWidth
                              variant="standard"
                              placeholder={t("ADMIN.CHOICE", { index: idx + 1 })}
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                            />
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
                        <Paper
                          key={idx}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderColor: selected ? "primary.light" : AdminQuizColors.softBorder,
                            bgcolor: selected ? AdminQuizColors.selectedBg : AdminQuizColors.page,
                          }}
                        >
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
                            <Stack sx={{ alignItems: "center" }}>
                              <Typography sx={{ mb: 0.5, fontSize: AdminQuizFontSizes.eyebrow, fontWeight: 700, textTransform: "uppercase", color: "text.secondary" }}>
                                {t("ADMIN.CORRECT_QUESTION")}
                              </Typography>
                              <Radio
                                name="correct_answer"
                                required
                                checked={selected}
                                onChange={() => setFormData({ ...formData, correct_answer: opt })}
                              />
                            </Stack>
                            <TextField
                              required
                              fullWidth
                              type="url"
                              label={t("ADMIN.OPTION_IMAGE_URL", { index: idx + 1 })}
                              placeholder={t("ADMIN.ENTER_IMAGE_URL")}
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                            />
                            {opt ? (
                              <Box
                                component="img"
                                src={opt}
                                alt=""
                                sx={{ width: 96, height: 56, objectFit: "cover", borderRadius: 1, border: `1px solid ${AdminQuizColors.border}` }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 96,
                                  height: 56,
                                  display: "grid",
                                  placeItems: "center",
                                  borderRadius: 1,
                                  border: `1px solid ${AdminQuizColors.border}`,
                                  bgcolor: "background.paper",
                                  color: AdminQuizColors.sidebarText,
                                }}
                              >
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
                  <Paper variant="outlined" sx={{ p: 2, borderColor: AdminQuizColors.textInputBorder, bgcolor: AdminQuizColors.textInputBg }}>
                    <TextField
                      required
                      fullWidth
                      label={t("ADMIN.TARGET_ANSWER")}
                      value={formData.correct_answer}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      placeholder={t("ADMIN.TARGET_ANSWER_PLACEHOLDER")}
                    />
                    <Typography sx={{ mt: 1, fontSize: AdminQuizFontSizes.caption, fontStyle: "italic", color: AdminQuizColors.textInputText }}>
                      {t("ADMIN.TEXT_ANSWER_NOTE")}
                    </Typography>
                  </Paper>
                )}

                {!formData.correct_answer && (
                  <Alert icon={<ErrorOutline fontSize="inherit" />} severity="warning">
                    {t("ADMIN.VALIDATION_CORRECT_ANSWER")}
                  </Alert>
                )}
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                  }
                  label={t("ADMIN.PUBLISHED_ACTIVE")}
                />
                <TextField
                  type="number"
                  label={t("ADMIN.SORT_ORDER")}
                  value={formData.order_index}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order_index: Number.parseInt(e.target.value, 10) || 1,
                    })
                  }
                  sx={{ width: { xs: "100%", md: 140 } }}
                />
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsModalOpen(false)}>{t("BUTTON.CANCEL")}</Button>
          <Button type="submit" form="quizForm" variant="contained" startIcon={<Check />}>
            {editingId ? t("ADMIN.UPDATE_QUESTION") : t("ADMIN.ADD_QUESTION")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
