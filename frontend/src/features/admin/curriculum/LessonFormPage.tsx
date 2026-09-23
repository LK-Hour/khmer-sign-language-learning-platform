"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box, Stack, TextField, Typography } from "@mui/material";

import EntityFormLayout from "../components/shared/EntityFormLayout";
import PublishStatusSwitch from "../components/shared/PublishStatusSwitch";
import SearchableDropdown from "../components/shared/SearchableDropdown";
import JunctionFieldEditor, {
  type JunctionItem,
} from "../components/shared/JunctionFieldEditor";
import { useEntityForm } from "../hooks/useEntityForm";
import { useTranslation } from "@/i18n/useTranslation";
import { useLocale } from "@/i18n/locale-context";
import * as adminApi from "../api/adminApi";
import {
  getLessonLetters,
  addLessonLetter,
  removeLessonLetter,
  getLessonWords,
  addLessonWord,
  removeLessonWord,
} from "../api/lessonAdminApi";
import {
  listCharacters,
  listWords,
  getCharacter,
  getWord,
  type DictionaryItem,
} from "../api/dictionaryAdminApi";
import type { MediaResponse } from "../api/mediaAdminApi";
import { MediaCarousel } from "../components/shared/MediaCarousel";
import type {
  AdminChapter,
  AdminLesson,
  AdminLessonPayload,
  AdminTrack,
} from "../api/types";
import { publishAfterSave } from "./publishAfterSave";

// ── Types ────────────────────────────────────────────────────────────────────

export type LessonTrack = "finger" | "word_detection";

export interface LessonFormPageProps {
  track: LessonTrack;
  entityId?: number; // Provided in edit mode
}

interface LessonFormValues {
  chapter_id: number | null;
  name_en: string;
  name_kh: string;
  description_en: string;
  description_kh: string;
  order_index: number;
  /** Read from the row; not editable here. Soft-deleted rows can't be published. */
  is_active: boolean;
  /** Desired publish state, applied on save. */
  is_published: boolean;
  [key: string]: unknown;
}

// ── Helpers ──────────────────────────────────────────────────────────────────


function getListPath(track: LessonTrack): string {
  return track === "finger"
    ? "/admin/learning/finger-spelling/lessons"
    : "/admin/learning/word-detection/lessons";
}

function validate(values: LessonFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name_en.trim()) {
    errors.name_en = "Name (EN) is required";
  }
  if (!values.name_kh.trim()) {
    errors.name_kh = "Name (KH) is required";
  }
  if (!values.chapter_id) {
    errors.chapter_id = "Chapter is required";
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

// ── Component ────────────────────────────────────────────────────────────────

export default function LessonFormPage({ track, entityId }: LessonFormPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const isEdit = entityId !== undefined;
  const listPath = `/${locale}${getListPath(track)}`;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(isEdit);
  // Id of the saved row. Set after the first successful save so that a retry (e.g. after a
  // failed publish) updates the row instead of creating a duplicate.
  const savedIdRef = useRef<number | undefined>(entityId);
  const [selectedChapter, setSelectedChapter] = useState<AdminChapter | null>(null);
  const [junctionItems, setJunctionItems] = useState<JunctionItem<DictionaryItem>[]>([]);
  const [initialJunctionIds, setInitialJunctionIds] = useState<Set<number>>(new Set());
  const [previewMedias, setPreviewMedias] = useState<MediaResponse[]>([]);

  // Form hook
  const form = useEntityForm<LessonFormValues, AdminLesson>({
    initialValues: {
      chapter_id: null,
      name_en: "",
      name_kh: "",
      description_en: "",
      description_kh: "",
      order_index: 1,
      is_active: true,
      is_published: false,
    },
    validate,
    onSubmit: async (values) => {
      const payload: AdminLessonPayload = {
        chapter_id: values.chapter_id!,
        name_en: values.name_en,
        name_kh: values.name_kh,
        description_en: values.description_en || null,
        description_kh: values.description_kh || null,
        order_index: values.order_index,
      };

      // Saving always leaves the row as a draft; publishing is a separate confirm call.
      const existingId = savedIdRef.current;
      const saved = existingId
        ? await adminApi.updateLesson(track as AdminTrack, existingId, payload)
        : await adminApi.createLesson(track as AdminTrack, payload);
      savedIdRef.current = saved.id;

      // Sync junction associations
      await syncJunctionAssociations(saved.id);
      // They are persisted now; a retry after a failed publish must not add them again.
      setInitialJunctionIds(new Set(junctionItems.map((ji) => ji.item.id)));

      if (!values.is_published) return saved;
      return publishAfterSave(() => adminApi.publishLesson(track as AdminTrack, saved.id));
    },
    onSuccess: (saved) => {
      const outcome =
        saved.publish_status === "published" ? "published" : isEdit ? "updated" : "created";
      router.push(`${listPath}?success=${outcome}`);
    },
  });

  // Sync junction associations: add new ones, remove deleted ones
  const syncJunctionAssociations = async (lessonId: number) => {
    const currentIds = new Set(junctionItems.map((ji) => ji.item.id));

    if (track === "finger") {
      // Add new letter associations
      for (const ji of junctionItems) {
        if (!initialJunctionIds.has(ji.item.id)) {
          await addLessonLetter(track as AdminTrack, lessonId, {
            letter_id: ji.item.id,
            order_index: ji.order_index,
          });
        }
      }
      // Remove deleted letter associations
      for (const id of initialJunctionIds) {
        if (!currentIds.has(id)) {
          await removeLessonLetter(track as AdminTrack, lessonId, id);
        }
      }
    } else {
      // Add new word associations
      for (const ji of junctionItems) {
        if (!initialJunctionIds.has(ji.item.id)) {
          await addLessonWord(track as AdminTrack, lessonId, {
            word_id: ji.item.id,
            order_index: ji.order_index,
          });
        }
      }
      // Remove deleted word associations
      for (const id of initialJunctionIds) {
        if (!currentIds.has(id)) {
          await removeLessonWord(track as AdminTrack, lessonId, id);
        }
      }
    }
  };

  // Load existing data in edit mode
  useEffect(() => {
    if (!isEdit || !entityId) return;

    const loadLesson = async () => {
      setLoading(true);
      try {
        const data = await adminApi.getLesson(track as AdminTrack, entityId);
        form.reset({
          chapter_id: data.chapter_id,
          name_en: data.name_en ?? "",
          name_kh: data.name_kh ?? "",
          description_en: data.description_en ?? "",
          description_kh: data.description_kh ?? "",
          order_index: data.order_index,
          is_active: data.is_active,
          is_published: data.publish_status === "published" && data.is_active,
        });

        // Load the chapter for the SearchableDropdown display
        try {
          const chapter = await adminApi.getChapter(track as AdminTrack, data.chapter_id);
          setSelectedChapter(chapter);
        } catch {
          // If we can't load the chapter, we still have the ID
        }

        // Load junction items (letters or words)
        try {
          if (track === "finger") {
            const letters = await getLessonLetters(track as AdminTrack, entityId);
            const items: JunctionItem<DictionaryItem>[] = letters.map((ll) => ({
              item: {
                id: ll.letter_id,
                name_en: ll.letter?.letter_en ?? null,
                name_kh: ll.letter?.letter_kh ?? "",
                media_count: 0,
                is_active: ll.letter?.is_active ?? true,
                created_at: "",
              },
              order_index: ll.order_index,
            }));
            setJunctionItems(items);
            setInitialJunctionIds(new Set(letters.map((ll) => ll.letter_id)));

            // Load first letter's media for preview
            if (letters.length > 0) {
              try {
                const detail = await getCharacter(letters[0].letter_id);
                if (detail.medias?.length > 0) {
                  setPreviewMedias(detail.medias);
                }
              } catch { /* non-critical */ }
            }
          } else {
            const words = await getLessonWords(track as AdminTrack, entityId);
            const items: JunctionItem<DictionaryItem>[] = words.map((lw) => ({
              item: {
                id: lw.word_id,
                name_en: lw.word?.word_en ?? null,
                name_kh: lw.word?.word_kh ?? "",
                media_count: 0,
                is_active: lw.word?.is_active ?? true,
                created_at: "",
              },
              order_index: lw.order_index,
            }));
            setJunctionItems(items);
            setInitialJunctionIds(new Set(words.map((lw) => lw.word_id)));

            // Load first word's media for preview
            if (words.length > 0) {
              try {
                const detail = await getWord(words[0].word_id);
                if (detail.medias?.length > 0) {
                  setPreviewMedias(detail.medias);
                }
              } catch { /* non-critical */ }
            }
          }
        } catch {
          // Junction load failure is non-critical
        }
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, track, isEdit]);

  // Fetch chapters for the SearchableDropdown
  const fetchChapters = useCallback(
    async (query: string): Promise<AdminChapter[]> => {
      const chapters = await adminApi.listChapters(track as AdminTrack);
      if (!query.trim()) return chapters;
      const lowerQuery = query.toLowerCase();
      return chapters.filter(
        (chapter) =>
          chapter.name_en.toLowerCase().includes(lowerQuery) ||
          chapter.name_kh.toLowerCase().includes(lowerQuery),
      );
    },
    [track],
  );

  // Fetch letters/words for JunctionFieldEditor
  const fetchJunctionOptions = useCallback(
    async (query: string): Promise<DictionaryItem[]> => {
      if (track === "finger") {
        const result = await listCharacters({
          search: query || undefined,
          page: 1,
          size: 20,
        });
        return result.items;
      }
      const result = await listWords({
        search: query || undefined,
        page: 1,
        size: 20,
      });
      return result.items;
    },
    [track],
  );

  // Handle chapter selection
  const handleChapterChange = (chapter: AdminChapter | null) => {
    setSelectedChapter(chapter);
    form.setField("chapter_id", chapter?.id ?? null);
  };

  // Junction editor handlers
  const handleAddJunctionItem = useCallback((item: DictionaryItem) => {
    setJunctionItems((prev) => [
      ...prev,
      { item, order_index: prev.length + 1 },
    ]);
  }, []);

  const handleRemoveJunctionItem = useCallback((item: DictionaryItem) => {
    setJunctionItems((prev) => {
      const filtered = prev.filter((ji) => ji.item.id !== item.id);
      return filtered.map((ji, i) => ({ ...ji, order_index: i + 1 }));
    });
  }, []);

  const handleReorderJunctionItems = useCallback(
    (items: JunctionItem<DictionaryItem>[]) => {
      setJunctionItems(items);
    },
    [],
  );

  // Breadcrumbs
  const trackLabel = track === "finger" ? t("ADMIN.TRACK_FINGER") : t("ADMIN.TRACK_WORD_DETECTION");
  const breadcrumbs = [
    { label: trackLabel, href: listPath },
    { label: t("FORM.LESSONS"), href: listPath },
    { label: isEdit ? t("PAGE.EDIT_LESSON") : t("PAGE.CREATE_LESSON") },
  ];

  const pageTitle = isEdit ? t("PAGE.EDIT_LESSON") : t("PAGE.CREATE_LESSON");
  const junctionLabel = track === "finger" ? t("FORM.LESSON_LETTERS") : t("FORM.LESSON_WORDS");
  const junctionSearchPlaceholder = t("FORM.SEARCH_PLACEHOLDER");

  return (
    <EntityFormLayout
      title={pageTitle}
      breadcrumbs={breadcrumbs}
      loading={loading}
      saving={form.isSubmitting}
      serverError={form.serverError}
      onSave={form.handleSubmit}
      onCancel={() => router.push(listPath)}
      previewPanel={
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {t("FORM.MEDIA_PREVIEW")}
          </Typography>
          <MediaCarousel
            medias={previewMedias}
            emptyLabel={t("FORM.NO_MEDIA_ASSOCIATED")}
          />
        </Stack>
      }
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
        </Stack>
      }
      statusSection={
        // Publish Status: applied on Save (save as draft, then publish if on)
        <PublishStatusSwitch
          checked={form.values.is_published}
          onChange={(published) => form.setField("is_published", published)}
          inactive={!form.values.is_active}
        />
      }
      junctionSection={
        <JunctionFieldEditor<DictionaryItem>
          label={junctionLabel}
          selectedItems={junctionItems}
          onAdd={handleAddJunctionItem}
          onRemove={handleRemoveJunctionItem}
          onReorder={handleReorderJunctionItems}
          fetchOptions={fetchJunctionOptions}
          getOptionLabel={(item) =>
            item.name_en
              ? `${item.name_en} · ${item.name_kh}`
              : item.name_kh
          }
          getOptionKey={(item) => item.id}
          showOrderIndex
        />
      }
    >
      {/* Main form fields */}
      <Stack spacing={3}>
        {/* Chapter selection (SearchableDropdown) */}
        <SearchableDropdown<AdminChapter>
          label={t("FORM.CHAPTER")}
          value={selectedChapter}
          onChange={handleChapterChange}
          fetchOptions={fetchChapters}
          getOptionLabel={(chapter) => `${chapter.name_en} · ${chapter.name_kh}`}
          getOptionKey={(chapter) => chapter.id}
          required
          error={!!form.errors.chapter_id}
          helperText={form.errors.chapter_id}
          placeholder={t("FORM.SEARCH_PLACEHOLDER")}
        />

        {/* Bilingual name fields in a two-column grid */}
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
            label={t("ADMIN.NAME_EN")}
            value={form.values.name_en}
            onChange={(e) => form.setField("name_en", e.target.value)}
            error={!!form.errors.name_en}
            helperText={form.errors.name_en}
          />
          <TextField
            required
            fullWidth
            label={t("ADMIN.NAME_KH")}
            value={form.values.name_kh}
            onChange={(e) => form.setField("name_kh", e.target.value)}
            error={!!form.errors.name_kh}
            helperText={form.errors.name_kh}
          />
        </Box>

        {/* Description fields */}
        <TextField
          fullWidth
          multiline
          minRows={3}
          label={t("ADMIN.DESCRIPTION_EN")}
          value={form.values.description_en}
          onChange={(e) => form.setField("description_en", e.target.value)}
          error={!!form.errors.description_en}
          helperText={form.errors.description_en}
        />
        <TextField
          fullWidth
          multiline
          minRows={3}
          label={t("ADMIN.DESCRIPTION_KH")}
          value={form.values.description_kh}
          onChange={(e) => form.setField("description_kh", e.target.value)}
          error={!!form.errors.description_kh}
          helperText={form.errors.description_kh}
        />
      </Stack>
    </EntityFormLayout>
  );
}
