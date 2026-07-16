"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from "@mui/material";

import EntityFormLayout from "../components/shared/EntityFormLayout";
import SearchableDropdown from "../components/shared/SearchableDropdown";
import OptionsEditor from "./OptionsEditor";
import type { ExerciseOptionFormState } from "./OptionsEditor";
import { useEntityForm } from "../hooks/useEntityForm";
import { useTranslation } from "@/i18n/useTranslation";
import * as adminApi from "../api/adminApi";
import { listMedia } from "../api/mediaAdminApi";
import type { MediaResponse } from "../api/mediaAdminApi";
import type {
  AdminExercise,
  AdminLesson,
  AdminTrack,
  AdminUnit,
} from "../api/types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseFormPageProps {
  entityId?: number; // Provided in edit mode
  track: AdminTrack; // Track is always provided by the route
}

interface ExerciseFormValues {
  unit_id: number | null;
  lesson_id: number | null;
  question_en: string;
  question_kh: string;
  exercise_type: string;
  media_id: number | null;
  explanation_en: string;
  explanation_kh: string;
  order_index: number;
  is_active: boolean;
  options: ExerciseOptionFormState[];
  [key: string]: unknown;
}

// ── Constants ────────────────────────────────────────────────────────────────

const EXERCISE_TYPES = [
  "multiple_choice",
  "true_false",
  "multiple_answer",
  "matching",
  "image_select",
  "free_form",
] as const;

/** Exercise types that support options editing */
const TYPES_WITH_OPTIONS = new Set([
  "multiple_choice",
  "image_select",
  "matching",
  "true_false",
  "multiple_answer",
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function validate(values: ExerciseFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.lesson_id) {
    errors.lesson_id = "Lesson is required";
  }
  if (!values.question_en.trim()) {
    errors.question_en = "Question (EN) is required";
  }
  if (!values.question_kh.trim()) {
    errors.question_kh = "Question (KH) is required";
  }
  if (!values.exercise_type) {
    errors.exercise_type = "Exercise type is required";
  }
  if (
    !values.order_index ||
    !Number.isInteger(values.order_index) ||
    values.order_index < 1
  ) {
    errors.order_index = "Order index must be a positive integer";
  }

  return errors;
}

function getUnitLabel(unit: AdminUnit): string {
  return `${unit.name_en} · ${unit.name_kh}`;
}

function getUnitKey(unit: AdminUnit): number {
  return unit.id;
}

function getLessonLabel(lesson: AdminLesson): string {
  return `${lesson.name_en} · ${lesson.name_kh}`;
}

function getLessonKey(lesson: AdminLesson): number {
  return lesson.id;
}

function getMediaLabel(media: MediaResponse): string {
  return media.file_url;
}

function getMediaKey(media: MediaResponse): number {
  return media.id;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ExerciseFormPage({ entityId, track }: ExerciseFormPageProps) {
  const router = useRouter();
  const isEdit = entityId !== undefined;
  const { t } = useTranslation();

  const trackSegment = track === "finger" ? "finger-spelling" : "word-detection";
  const backPath = `/admin/learning/quiz/${trackSegment}`;

  const [loading, setLoading] = useState(isEdit);
  const [removedOptionIds, setRemovedOptionIds] = useState<number[]>([]);

  // Selected unit/lesson objects for the dropdown display
  const [selectedUnit, setSelectedUnit] = useState<AdminUnit | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<AdminLesson | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaResponse | null>(null);

  // Form hook
  const form = useEntityForm<ExerciseFormValues, AdminExercise>({
    initialValues: {
      unit_id: null,
      lesson_id: null,
      question_en: "",
      question_kh: "",
      exercise_type: "multiple_choice",
      media_id: null,
      explanation_en: "",
      explanation_kh: "",
      order_index: 1,
      is_active: true,
      options: [],
    },
    validate,
    onSubmit: async (values) => {
      const exerciseBody = {
        lesson_id: values.lesson_id!,
        question_en: values.question_en,
        question_kh: values.question_kh,
        exercise_type: values.exercise_type,
        media_id: values.media_id || undefined,
        explanation_en: values.explanation_en || null,
        explanation_kh: values.explanation_kh || null,
        order_index: values.order_index,
      };

      const optionPayloads = TYPES_WITH_OPTIONS.has(values.exercise_type)
        ? values.options.map((opt) => ({
            option_text_en: opt.option_text_en || null,
            option_text_kh: opt.option_text_kh || null,
            media_id: opt.media_id || undefined,
            is_correct: opt.is_correct,
            points: opt.points,
            order_index: opt.order_index,
          }))
        : [];

      if (!isEdit) {
        return adminApi.createExercise(track as AdminTrack, {
          ...exerciseBody,
          options: optionPayloads,
        });
      }

      // Update exercise
      await adminApi.updateExercise(track as AdminTrack, entityId!, exerciseBody);

      // Update options
      if (TYPES_WITH_OPTIONS.has(values.exercise_type)) {
        // Remove deleted options
        for (const optionId of removedOptionIds) {
          await adminApi.deleteExerciseOption(track as AdminTrack, optionId);
        }
        // Create or update remaining options
        for (const opt of values.options) {
          const optPayload = {
            option_text_en: opt.option_text_en || null,
            option_text_kh: opt.option_text_kh || null,
            is_correct: opt.is_correct,
            points: opt.points,
            order_index: opt.order_index,
          };
          if (opt.id === undefined) {
            await adminApi.createExerciseOption(
              track as AdminTrack,
              entityId!,
              optPayload,
            );
          } else {
            await adminApi.updateExerciseOption(
              track as AdminTrack,
              opt.id,
              optPayload,
            );
          }
        }
      }

      // Re-fetch updated exercise
      return adminApi.getExercise(track as AdminTrack, entityId!);
    },
    onSuccess: () => {
      router.push(`${backPath}?success=${isEdit ? "updated" : "created"}`);
    },
  });

  // Load existing exercise in edit mode
  useEffect(() => {
    if (!isEdit || !entityId) return;

    const loadExercise = async () => {
      setLoading(true);
      try {
        const data = await adminApi.getExercise(track as AdminTrack, entityId);

        // Pre-populate form values
        form.reset({
          unit_id: null, // Will be set after loading units
          lesson_id: data.lesson_id,
          question_en: data.question_en ?? "",
          question_kh: data.question_kh ?? "",
          exercise_type: data.exercise_type,
          media_id: data.media_id,
          explanation_en: data.explanation_en ?? "",
          explanation_kh: data.explanation_kh ?? "",
          order_index: data.order_index,
          is_active: data.is_active,
          options: data.options.map((opt) => ({
            id: opt.id,
            option_text_en: opt.option_text_en ?? "",
            option_text_kh: opt.option_text_kh ?? "",
            media_id: opt.media_id,
            is_correct: opt.is_correct,
            points: opt.points,
            order_index: opt.order_index,
          })),
        });

        // Set selected media object for the dropdown
        if (data.media_id && data.media) {
          setSelectedMedia(data.media as unknown as MediaResponse);
        }

        // Find the lesson to determine unit
        try {
          const lessons = await adminApi.listLessons(track as AdminTrack);
          const lesson = lessons.find((l) => l.id === data.lesson_id);
          if (lesson) {
            setSelectedLesson(lesson);
            // Find unit from chapter
            const chapters = await adminApi.listChapters(track as AdminTrack);
            const chapter = chapters.find((c) => c.id === lesson.chapter_id);
            if (chapter) {
              const units = await adminApi.listUnits(track as AdminTrack);
              const unit = units.find((u) => u.id === chapter.unit_id);
              if (unit) {
                setSelectedUnit(unit);
                form.setField("unit_id", unit.id);
              }
            }
          }
        } catch {
          // Non-critical: unit lookup failed
        }
      } finally {
        setLoading(false);
      }
    };

    loadExercise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, track, isEdit]);

  // Fetch units for dropdown
  const fetchUnits = useCallback(
    async (query: string): Promise<AdminUnit[]> => {
      const units = await adminApi.listUnits(track as AdminTrack);
      if (!query.trim()) return units;
      const needle = query.toLowerCase();
      return units.filter(
        (u) =>
          u.name_en.toLowerCase().includes(needle) ||
          u.name_kh.toLowerCase().includes(needle),
      );
    },
    [track],
  );

  // Fetch lessons filtered by selected unit
  const fetchLessons = useCallback(
    async (query: string): Promise<AdminLesson[]> => {
      const lessons = await adminApi.listLessons(track as AdminTrack);
      let filtered = lessons;

      // Filter by unit if selected (through chapter hierarchy)
      if (form.values.unit_id) {
        const chapters = await adminApi.listChapters(track as AdminTrack, form.values.unit_id);
        const chapterIds = new Set(chapters.map((c) => c.id));
        filtered = filtered.filter((l) => chapterIds.has(l.chapter_id));
      }

      if (!query.trim()) return filtered;
      const needle = query.toLowerCase();
      return filtered.filter(
        (l) =>
          l.name_en.toLowerCase().includes(needle) ||
          l.name_kh.toLowerCase().includes(needle),
      );
    },
    [track, form.values.unit_id],
  );

  // Fetch media for dropdown
  const fetchMedia = useCallback(async (query: string): Promise<MediaResponse[]> => {
    const response = await listMedia({ search: query, size: 20 });
    return response.items;
  }, []);

  // Handle unit change
  const handleUnitChange = (unit: AdminUnit | null) => {
    setSelectedUnit(unit);
    form.setField("unit_id", unit ? unit.id : null);
    // Reset lesson when unit changes
    setSelectedLesson(null);
    form.setField("lesson_id", null);
  };

  // Handle lesson change
  const handleLessonChange = (lesson: AdminLesson | null) => {
    setSelectedLesson(lesson);
    form.setField("lesson_id", lesson ? lesson.id : null);
  };

  // Handle media change
  const handleMediaChange = (media: MediaResponse | null) => {
    setSelectedMedia(media);
    form.setField("media_id", media ? media.id : null);
  };

  // Handle options change
  const handleOptionsChange = (options: ExerciseOptionFormState[]) => {
    // Track removed options for edit mode
    const currentIds = new Set(options.map((o) => o.id).filter(Boolean));
    const previousOptions = form.values.options;
    for (const prevOpt of previousOptions) {
      if (prevOpt.id !== undefined && !currentIds.has(prevOpt.id)) {
        setRemovedOptionIds((ids) =>
          ids.includes(prevOpt.id!) ? ids : [...ids, prevOpt.id!],
        );
      }
    }
    form.setField("options", options);
  };

  // Track change is no longer needed — track comes from the route

  const showOptions = TYPES_WITH_OPTIONS.has(form.values.exercise_type);

  // Breadcrumbs
  const trackLabel = track === "finger" ? t("ADMIN.TRACK_FINGER") : t("ADMIN.TRACK_WORD_DETECTION");
  const breadcrumbs = [
    { label: t("PAGE.UNIT_QUIZ"), href: backPath },
    { label: trackLabel },
    { label: isEdit ? t("PAGE.EDIT_EXERCISE") : t("PAGE.CREATE_EXERCISE") },
  ];

  const pageTitle = isEdit ? t("PAGE.EDIT_EXERCISE") : t("PAGE.CREATE_EXERCISE");

  return (
    <EntityFormLayout
      title={pageTitle}
      breadcrumbs={breadcrumbs}
      loading={loading}
      saving={form.isSubmitting}
      serverError={form.serverError}
      onSave={form.handleSubmit}
      onCancel={() => router.push(backPath)}
      sidebar={
        <Stack spacing={3}>
          {/* Order Index */}
          <TextField
            required
            fullWidth
            type="number"
            label={t("FORM.ORDER_INDEX")}
            value={form.values.order_index}
            onChange={(e) =>
              form.setField(
                "order_index",
                Number.parseInt(e.target.value, 10) || 0,
              )
            }
            error={!!form.errors.order_index}
            helperText={form.errors.order_index}
            slotProps={{ htmlInput: { min: 1 } }}
          />

          {/* Active Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={form.values.is_active}
                onChange={(e) => form.setField("is_active", e.target.checked)}
              />
            }
            label={t("FORM.ACTIVE")}
          />
        </Stack>
      }
      junctionSection={
        showOptions ? (
          <OptionsEditor
            options={form.values.options}
            onChange={handleOptionsChange}
            exerciseType={form.values.exercise_type}
          />
        ) : undefined
      }
    >
      {/* Main form fields */}
      <Stack spacing={3}>
        {/* Unit and Lesson dropdowns */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <SearchableDropdown<AdminUnit>
            label={t("FORM.UNIT")}
            value={selectedUnit}
            onChange={handleUnitChange}
            fetchOptions={fetchUnits}
            getOptionLabel={getUnitLabel}
            getOptionKey={getUnitKey}
            placeholder={t("FORM.SELECT_PLACEHOLDER")}
          />
          <SearchableDropdown<AdminLesson>
            label={t("FORM.LESSON")}
            value={selectedLesson}
            onChange={handleLessonChange}
            fetchOptions={fetchLessons}
            getOptionLabel={getLessonLabel}
            getOptionKey={getLessonKey}
            required
            error={!!form.errors.lesson_id}
            helperText={form.errors.lesson_id}
            placeholder={t("FORM.SELECT_PLACEHOLDER")}
          />
        </Box>

        {/* Exercise type */}
          <TextField
            select
            required
            fullWidth
            label={t("FORM.EXERCISE_TYPE")}
          value={form.values.exercise_type}
          onChange={(e) => form.setField("exercise_type", e.target.value)}
          error={!!form.errors.exercise_type}
          helperText={form.errors.exercise_type}
        >
          {EXERCISE_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type.replace(/_/g, " ")}
            </MenuItem>
          ))}
        </TextField>

        {/* Bilingual question fields */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            required
            fullWidth
            multiline
            minRows={2}
            label={t("ADMIN.QUESTION_EN")}
            value={form.values.question_en}
            onChange={(e) => form.setField("question_en", e.target.value)}
            error={!!form.errors.question_en}
            helperText={form.errors.question_en}
          />
          <TextField
            required
            fullWidth
            multiline
            minRows={2}
            label={t("ADMIN.QUESTION_KH")}
            value={form.values.question_kh}
            onChange={(e) => form.setField("question_kh", e.target.value)}
            error={!!form.errors.question_kh}
            helperText={form.errors.question_kh}
          />
        </Box>

        {/* Media dropdown */}
        <SearchableDropdown<MediaResponse>
          label={t("FORM.MEDIA_OPTIONAL")}
          value={selectedMedia}
          onChange={handleMediaChange}
          fetchOptions={fetchMedia}
          getOptionLabel={getMediaLabel}
          getOptionKey={getMediaKey}
          placeholder={t("FORM.SEARCH_PLACEHOLDER")}
        />

        {/* Bilingual explanation fields */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={t("FORM.EXPLANATION") + " (EN)"}
            value={form.values.explanation_en}
            onChange={(e) => form.setField("explanation_en", e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={t("FORM.EXPLANATION") + " (KH)"}
            value={form.values.explanation_kh}
            onChange={(e) => form.setField("explanation_kh", e.target.value)}
          />
        </Box>
      </Stack>
    </EntityFormLayout>
  );
}
