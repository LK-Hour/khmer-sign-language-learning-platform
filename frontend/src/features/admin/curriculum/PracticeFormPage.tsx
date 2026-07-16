"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import EntityFormLayout from "../components/shared/EntityFormLayout";
import SearchableDropdown from "../components/shared/SearchableDropdown";
import JunctionFieldEditor, {
  type JunctionItem,
} from "../components/shared/JunctionFieldEditor";
import { useEntityForm } from "../hooks/useEntityForm";
import * as adminApi from "../api/adminApi";
import {
  getPractice,
  createPractice,
  updatePractice,
  addPracticeMedia,
  removePracticeMedia,
  type AdminPractice,
} from "../api/practiceAdminApi";
import {
  listMedia,
  type MediaResponse,
} from "../api/mediaAdminApi";
import type { AdminChapter, AdminTrack } from "../api/types";

// ── Types ────────────────────────────────────────────────────────────────────

export type PracticeTrack = "finger" | "word_detection";

export interface PracticeFormPageProps {
  track: PracticeTrack;
  entityId?: number; // Provided in edit mode
}

interface PracticeFormValues {
  chapter_id: number | null;
  lesson_count: number;
  is_active: boolean;
  [key: string]: unknown;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTrackLabel(track: PracticeTrack): string {
  return track === "finger" ? "Finger Spelling" : "Word Detection";
}

function getListPath(track: PracticeTrack): string {
  return track === "finger"
    ? "/admin/learning/finger-spelling/practices"
    : "/admin/learning/word-detection/practices";
}

function validate(values: PracticeFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.chapter_id) {
    errors.chapter_id = "Chapter is required";
  }
  if (
    !values.lesson_count ||
    !Number.isInteger(values.lesson_count) ||
    values.lesson_count < 1
  ) {
    errors.lesson_count = "Lesson count must be a positive integer";
  }

  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PracticeFormPage({
  track,
  entityId,
}: PracticeFormPageProps) {
  const router = useRouter();
  const isEdit = entityId !== undefined;
  const trackLabel = getTrackLabel(track);
  const listPath = getListPath(track);

  const [loading, setLoading] = useState(isEdit);
  const [selectedChapter, setSelectedChapter] = useState<AdminChapter | null>(
    null,
  );
  const [mediaItems, setMediaItems] = useState<JunctionItem<MediaResponse>[]>(
    [],
  );
  const [initialMediaIds, setInitialMediaIds] = useState<Set<number>>(
    new Set(),
  );

  // Form hook
  const form = useEntityForm<PracticeFormValues, AdminPractice>({
    initialValues: {
      chapter_id: null,
      lesson_count: 5,
      is_active: true,
    },
    validate,
    onSubmit: async (values) => {
      const payload = {
        chapter_id: values.chapter_id!,
        lesson_count: values.lesson_count,
        is_active: values.is_active,
      };

      let savedId = entityId;

      if (isEdit && entityId) {
        await updatePractice(track as AdminTrack, entityId, payload);
        savedId = entityId;
      } else {
        const result = await createPractice(track as AdminTrack, payload);
        savedId = result.id;
      }

      // Sync media associations
      await syncMediaAssociations(savedId!);

      return { id: savedId } as AdminPractice;
    },
    onSuccess: () => {
      router.push(`${listPath}?success=${isEdit ? "updated" : "created"}`);
    },
  });

  // Sync media associations: add new ones, remove deleted ones
  const syncMediaAssociations = async (practiceId: number) => {
    const currentMediaIds = new Set(mediaItems.map((mi) => mi.item.id));

    // Add new associations
    for (const mediaId of currentMediaIds) {
      if (!initialMediaIds.has(mediaId)) {
        await addPracticeMedia(track as AdminTrack, practiceId, {
          media_id: mediaId,
        });
      }
    }

    // Remove deleted associations
    for (const mediaId of initialMediaIds) {
      if (!currentMediaIds.has(mediaId)) {
        await removePracticeMedia(track as AdminTrack, practiceId, mediaId);
      }
    }
  };

  // Load existing data in edit mode
  useEffect(() => {
    if (!isEdit || !entityId) return;

    const loadPractice = async () => {
      setLoading(true);
      try {
        const data = await getPractice(track as AdminTrack, entityId);
        form.reset({
          chapter_id: data.chapter_id,
          lesson_count: data.lesson_count,
          is_active: data.is_active,
        });

        // Load the chapter for the SearchableDropdown display
        try {
          const chapter = await adminApi.getChapter(
            track as AdminTrack,
            data.chapter_id,
          );
          setSelectedChapter(chapter);
        } catch {
          // If we can't load the chapter, we still have the ID
        }

        // Load media associations
        const medias = data.practice_medias ?? [];
        const mediaItemsList: JunctionItem<MediaResponse>[] = medias
          .filter((pm) => pm.media)
          .map((pm, i) => ({
            item: pm.media!,
            order_index: i + 1,
          }));
        setMediaItems(mediaItemsList);
        setInitialMediaIds(new Set(medias.map((pm) => pm.media_id)));
      } finally {
        setLoading(false);
      }
    };

    loadPractice();
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

  // Media search fetcher for JunctionFieldEditor
  const fetchMediaOptions = useCallback(async (query: string) => {
    const result = await listMedia({
      search: query || undefined,
      page: 1,
      size: 20,
    });
    return result.items;
  }, []);

  // Handle chapter selection
  const handleChapterChange = (chapter: AdminChapter | null) => {
    setSelectedChapter(chapter);
    form.setField("chapter_id", chapter?.id ?? null);
  };

  // Junction editor handlers
  const handleAddMedia = useCallback((media: MediaResponse) => {
    setMediaItems((prev) => [
      ...prev,
      { item: media, order_index: prev.length + 1 },
    ]);
  }, []);

  const handleRemoveMedia = useCallback((media: MediaResponse) => {
    setMediaItems((prev) => {
      const filtered = prev.filter((mi) => mi.item.id !== media.id);
      return filtered.map((mi, i) => ({ ...mi, order_index: i + 1 }));
    });
  }, []);

  const handleReorderMedia = useCallback(
    (items: JunctionItem<MediaResponse>[]) => {
      setMediaItems(items);
    },
    [],
  );

  // Breadcrumbs
  const breadcrumbs = [
    { label: trackLabel, href: listPath },
    { label: "Practices", href: listPath },
    { label: isEdit ? "Edit Practice" : "Create Practice" },
  ];

  const pageTitle = isEdit ? "Edit Practice" : "Create Practice";

  return (
    <EntityFormLayout
      title={pageTitle}
      breadcrumbs={breadcrumbs}
      loading={loading}
      saving={form.isSubmitting}
      serverError={form.serverError}
      onSave={form.handleSubmit}
      onCancel={() => router.push(listPath)}
      sidebar={
        <Stack spacing={3}>
          {/* Lesson Count */}
          <TextField
            required
            fullWidth
            type="number"
            label="Lesson Count"
            value={form.values.lesson_count}
            onChange={(e) =>
              form.setField(
                "lesson_count",
                Number.parseInt(e.target.value, 10) || 0,
              )
            }
            error={!!form.errors.lesson_count}
            helperText={form.errors.lesson_count}
            slotProps={{ htmlInput: { min: 1 } }}
          />

          {/* Active Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={form.values.is_active}
                onChange={(e) =>
                  form.setField("is_active", e.target.checked)
                }
              />
            }
            label="Active"
          />
        </Stack>
      }
      junctionSection={
        <JunctionFieldEditor<MediaResponse>
          label="Practice Media"
          selectedItems={mediaItems}
          onAdd={handleAddMedia}
          onRemove={handleRemoveMedia}
          onReorder={handleReorderMedia}
          fetchOptions={fetchMediaOptions}
          getOptionLabel={(media) =>
            media.file_url
              ? `${media.file_url} (${media.media_type})`
              : `Media #${media.id}`
          }
          getOptionKey={(media) => media.id}
          showOrderIndex={false}
        />
      }
    >
      {/* Main form fields */}
      <Stack spacing={3}>
        {/* Chapter selection (SearchableDropdown) */}
        <SearchableDropdown<AdminChapter>
          label="Chapter"
          value={selectedChapter}
          onChange={handleChapterChange}
          fetchOptions={fetchChapters}
          getOptionLabel={(chapter) =>
            `${chapter.name_en} · ${chapter.name_kh}`
          }
          getOptionKey={(chapter) => chapter.id}
          required
          error={!!form.errors.chapter_id}
          helperText={form.errors.chapter_id}
          placeholder="Search chapters..."
        />

        <Typography variant="body2" color="text.secondary">
          Configure the practice session settings for the selected chapter.
          The lesson count determines how many lessons are included in each
          practice session.
        </Typography>
      </Stack>
    </EntityFormLayout>
  );
}
