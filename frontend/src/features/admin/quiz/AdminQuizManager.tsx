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
import { INITIAL_QUESTIONS, MOCK_CONTEXT } from "./mockData";
import type { AdminQuizQuestion, AdminQuizQuestionType } from "./types";

function typeLabel(type: AdminQuizQuestionType): string {
  if (type === "MULTIPLE_CHOICE") return "Multiple Choice";
  if (type === "IMAGE_CHOICE") return "Image Selection";
  return "Text Input";
}

function typeChipStyles(type: AdminQuizQuestionType) {
  if (type === "MULTIPLE_CHOICE") {
    return { bgcolor: "#eef2ff", color: "#4f46e5" };
  }
  if (type === "IMAGE_CHOICE") {
    return { bgcolor: "#fff7ed", color: "#d97706" };
  }
  return { bgcolor: "#ecfdf5", color: "#059669" };
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
        window.alert("Please select or define a valid correct answer.");
        return;
      }
    } else if (!formData.correct_answer.trim()) {
      window.alert("Please enter the correct answer text.");
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
    <Stack direction="row" sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Stack
        component="aside"
        sx={{
          display: { xs: "none", md: "flex" },
          width: 256,
          flexShrink: 0,
          bgcolor: "#0f172a",
          color: "#cbd5e1",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid #1e293b",
            bgcolor: "#020617",
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              display: "grid",
              placeItems: "center",
              bgcolor: "#2563eb",
              color: "common.white",
              fontWeight: 700,
            }}
          >
            K
          </Box>
          <Stack>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "common.white", lineHeight: 1 }}>
              KSL Admin
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 10, textTransform: "uppercase", color: "#64748b" }}>
              Management
            </Typography>
          </Stack>
        </Stack>

        <Stack component="nav" spacing={1} sx={{ flex: 1, p: 2 }}>
          <Typography sx={{ px: 1, mb: 1, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#64748b" }}>
            Navigation
          </Typography>
          <Button
            startIcon={<Layers sx={{ fontSize: 18 }} />}
            sx={{
              justifyContent: "flex-start",
              color: "#60a5fa",
              bgcolor: "rgba(37,99,235,0.1)",
              border: "1px solid rgba(37,99,235,0.2)",
              "&:hover": { bgcolor: "rgba(37,99,235,0.16)" },
            }}
          >
            Curriculum
          </Button>
          <Button
            startIcon={<MenuBook sx={{ fontSize: 18 }} />}
            sx={{
              justifyContent: "flex-start",
              color: "#94a3b8",
              "&:hover": { bgcolor: "#1e293b", color: "common.white" },
            }}
          >
            Exercises
          </Button>
        </Stack>
      </Stack>

      <Stack component="main" sx={{ flex: 1, minWidth: 0 }}>
        <Paper square elevation={0} sx={{ zIndex: 1, p: 2, borderBottom: "1px solid #e2e8f0" }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {[MOCK_CONTEXT.track, MOCK_CONTEXT.unit.title, MOCK_CONTEXT.chapter.title].map(
                (item, index) => (
                  <Stack key={item} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    {index > 0 && <Typography sx={{ color: "#cbd5e1" }}>/</Typography>}
                    <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: "#94a3b8" }}>
                      {item}
                    </Typography>
                  </Stack>
                )
              )}
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" } }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <FormatListNumbered sx={{ fontSize: 24, color: "#2563eb" }} />
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  Quiz Management
                </Typography>
              </Stack>
              <Button variant="contained" startIcon={<Add />} onClick={openCreateModal}>
                Add Question
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Stack sx={{ flex: 1, overflow: "auto", p: { xs: 2, md: 3 } }}>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell align="center" sx={{ width: 64, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
                    Ord
                  </TableCell>
                  <TableCell sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
                    Content Preview
                  </TableCell>
                  <TableCell sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
                    Status
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedQuestions.map((q) => (
                  <TableRow key={q.id} hover sx={{ opacity: q.is_active ? 1 : 0.55 }}>
                    <TableCell align="center" sx={{ fontFamily: "var(--font-app-mono)", fontSize: 12, color: "#94a3b8" }}>
                      {q.order_index}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                        {q.prompt}
                      </Typography>
                      <Typography sx={{ mt: 0.5, fontSize: 12, fontStyle: "italic", color: "#64748b" }}>
                        {q.correct_answer && q.type === "TEXT_INPUT"
                          ? `Answer: ${q.correct_answer}`
                          : q.prompt_kh}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={typeLabel(q.type)}
                        size="small"
                        sx={{ ...typeChipStyles(q.type), height: 22, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={q.is_active ? "Active" : "Inactive"}
                        size="small"
                        color={q.is_active ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton aria-label="Edit question" onClick={() => openEditModal(q)} size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={q.is_active ? "Deactivate question" : "Activate question"}
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
              {editingId ? "Edit Question" : "Add New Question"}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "text.secondary" }}>
              {formData.type} Interaction Mode
            </Typography>
          </Stack>
          <IconButton aria-label="Close dialog" onClick={() => setIsModalOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#f8fafc" }}>
          <Stack id="quizForm" component="form" onSubmit={handleSave} spacing={3}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography sx={{ mb: 1.5, textAlign: "center", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "text.secondary" }}>
                Select Quiz Interaction Type
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={formData.type}
                onChange={(_, value) => handleTypeChange(value)}
              >
                {TYPE_OPTIONS.map((type) => (
                  <ToggleButton key={type} value={type} sx={{ fontSize: 12, fontWeight: 700 }}>
                    {typeLabel(type)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
                  <TextFields sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                    Question Title / Prompt
                  </Typography>
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    required
                    fullWidth
                    label="Title (EN)"
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Title (KH)"
                    value={formData.prompt_kh}
                    onChange={(e) => setFormData({ ...formData, prompt_kh: e.target.value })}
                    placeholder="បញ្ចូលចំណងជើងជាភាសាខ្មែរ"
                  />
                </Stack>
              </Stack>
            </Paper>

            {(formData.type === "MULTIPLE_CHOICE" || formData.type === "TEXT_INPUT") && (
              <Paper variant="outlined" sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
                    <ImageIcon sx={{ fontSize: 16 }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                      Question Visual Content
                    </Typography>
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
                    <TextField
                      required
                      fullWidth
                      type="url"
                      label="Question Image URL"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.png"
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
                          border: "1px solid #e2e8f0",
                          bgcolor: "#f1f5f9",
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
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "primary.main" }}>
                    <Check sx={{ fontSize: 18 }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                      Answer Configuration
                    </Typography>
                  </Stack>
                  {formData.type !== "TEXT_INPUT" && (
                    <Chip label="Choose correct option" size="small" />
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
                              borderColor: selected ? "primary.light" : "#f1f5f9",
                              bgcolor: selected ? "#f3f9ff" : "#f8fafc",
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
                              placeholder={`Choice ${idx + 1}`}
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
                            borderColor: selected ? "primary.light" : "#f1f5f9",
                            bgcolor: selected ? "#f3f9ff" : "#f8fafc",
                          }}
                        >
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
                            <Stack sx={{ alignItems: "center" }}>
                              <Typography sx={{ mb: 0.5, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "text.secondary" }}>
                                Correct?
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
                              label={`Option Image URL ${idx + 1}`}
                              placeholder="Enter image URL..."
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                            />
                            {opt ? (
                              <Box
                                component="img"
                                src={opt}
                                alt=""
                                sx={{ width: 96, height: 56, objectFit: "cover", borderRadius: 1, border: "1px solid #e2e8f0" }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 96,
                                  height: 56,
                                  display: "grid",
                                  placeItems: "center",
                                  borderRadius: 1,
                                  border: "1px solid #e2e8f0",
                                  bgcolor: "background.paper",
                                  color: "#cbd5e1",
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
                  <Paper variant="outlined" sx={{ p: 2, borderColor: "#a7f3d0", bgcolor: "#ecfdf5" }}>
                    <TextField
                      required
                      fullWidth
                      label="Target Correct Answer Text"
                      value={formData.correct_answer}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      placeholder="What is the exact text the user should type?"
                    />
                    <Typography sx={{ mt: 1, fontSize: 11, fontStyle: "italic", color: "#059669" }}>
                      Note: System will compare user input with this value for scoring.
                    </Typography>
                  </Paper>
                )}

                {!formData.correct_answer && (
                  <Alert icon={<ErrorOutline fontSize="inherit" />} severity="warning">
                    Validation: A correct answer must be specified to save this question.
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
                  label="Published & Active"
                />
                <TextField
                  type="number"
                  label="Sort Order"
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
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="quizForm" variant="contained" startIcon={<Check />}>
            {editingId ? "Update Question" : "Add Question"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
