"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import EntityFormLayout from "../components/shared/EntityFormLayout";
import JunctionFieldEditor, {
  type JunctionItem,
} from "../components/shared/JunctionFieldEditor";
import { useEntityForm } from "../hooks/useEntityForm";
import { useTranslation } from "@/i18n/useTranslation";
import {
  getCharacter,
  createCharacter,
  updateCharacter,
  getWord,
  createWord,
  updateWord,
  type LetterPayload,
  type WordPayload,
} from "../api/dictionaryAdminApi";
import {
  listMedia,
  associateMedia,
  disassociateMedia,
  type MediaResponse,
} from "../api/mediaAdminApi";

// ── Types ────────────────────────────────────────────────────────────────────

export type EntityType = "letter" | "word";

export interface LetterWordFormPageProps {
  entityType: EntityType;
  entityId?: number; // Provided in edit mode
}

interface LetterWordFormValues {
  name_en: string;
  name_kh: string;
  description_en: string;
  description_kh: string;
  is_active: boolean;
  [key: string]: unknown;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLabels(entityType: EntityType) {
  if (entityType === "letter") {
    return {
      entityName: "Character",
      nameEnLabel: "Letter (EN)",
      nameKhLabel: "Letter (KH)",
      listPath: "/admin/dictionary/characters",
      junctionLabel: "Associated Media",
    };
  }
  return {
    entityName: "Word",
    nameEnLabel: "Word (EN)",
    nameKhLabel: "Word (KH)",
    listPath: "/admin/dictionary/words",
    junctionLabel: "Associated Media",
  };
}

function validate(
  values: LetterWordFormValues,
  entityType: EntityType,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name_en.trim()) {
    errors.name_en =
      entityType === "letter"
        ? "Letter (EN) is required"
        : "Word (EN) is required";
  }
  if (!values.name_kh.trim()) {
    errors.name_kh =
      entityType === "letter"
        ? "Letter (KH) is required"
        : "Word (KH) is required";
  }

  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LetterWordFormPage({
  entityType,
  entityId,
}: LetterWordFormPageProps) {
  const router = useRouter();
  const isEdit = entityId !== undefined;
  const labels = getLabels(entityType);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(isEdit);
  const [mediaItems, setMediaItems] = useState<JunctionItem<MediaResponse>[]>(
    [],
  );
  const [initialMediaIds, setInitialMediaIds] = useState<Set<number>>(
    new Set(),
  );

  // Form hook
  const form = useEntityForm<LetterWordFormValues, unknown>({
    initialValues: {
      name_en: "",
      name_kh: "",
      description_en: "",
      description_kh: "",
      is_active: true,
    },
    validate: (values) => validate(values, entityType),
    onSubmit: async (values) => {
      // Build payload
      if (entityType === "letter") {
        const payload: LetterPayload = {
          letter_en: values.name_en,
          letter_kh: values.name_kh,
          description_en: values.description_en || null,
          description_kh: values.description_kh || null,
          is_active: values.is_active,
        };

        let savedId = entityId;

        if (isEdit && entityId) {
          await updateCharacter(entityId, payload);
          savedId = entityId;
        } else {
          const result = await createCharacter(payload);
          savedId = result.id;
        }

        // Sync media associations
        await syncMediaAssociations(savedId!, "letter");
      } else {
        const payload: WordPayload = {
          word_en: values.name_en,
          word_kh: values.name_kh,
          description_en: values.description_en || null,
          description_kh: values.description_kh || null,
          is_active: values.is_active,
        };

        let savedId = entityId;

        if (isEdit && entityId) {
          await updateWord(entityId, payload);
          savedId = entityId;
        } else {
          const result = await createWord(payload);
          savedId = result.id;
        }

        // Sync media associations
        await syncMediaAssociations(savedId!, "word");
      }
    },
    onSuccess: () => {
      router.push(`${labels.listPath}?success=${isEdit ? "updated" : "created"}`);
    },
  });

  // Sync media associations: add new ones, remove deleted ones
  const syncMediaAssociations = async (
    targetId: number,
    targetType: "letter" | "word",
  ) => {
    const currentMediaIds = new Set(mediaItems.map((mi) => mi.item.id));

    // Add new associations
    for (const mediaId of currentMediaIds) {
      if (!initialMediaIds.has(mediaId)) {
        await associateMedia(mediaId, {
          target_type: targetType,
          target_id: targetId,
        });
      }
    }

    // Remove deleted associations
    for (const mediaId of initialMediaIds) {
      if (!currentMediaIds.has(mediaId)) {
        await disassociateMedia(mediaId, {
          target_type: targetType,
          target_id: targetId,
        });
      }
    }
  };

  // Load existing data in edit mode
  useEffect(() => {
    if (!isEdit || !entityId) return;

    const loadEntity = async () => {
      setLoading(true);
      try {
        if (entityType === "letter") {
          const data = await getCharacter(entityId);
          form.reset({
            name_en: data.letter_en ?? "",
            name_kh: data.letter_kh ?? "",
            description_en: data.description_en ?? "",
            description_kh: data.description_kh ?? "",
            is_active: data.is_active,
          });
          const items: JunctionItem<MediaResponse>[] = (data.medias ?? []).map(
            (m, i) => ({
              item: m,
              order_index: i + 1,
            }),
          );
          setMediaItems(items);
          setInitialMediaIds(new Set((data.medias ?? []).map((m) => m.id)));
        } else {
          const data = await getWord(entityId);
          form.reset({
            name_en: data.word_en ?? "",
            name_kh: data.word_kh ?? "",
            description_en: data.description_en ?? "",
            description_kh: data.description_kh ?? "",
            is_active: data.is_active,
          });
          const items: JunctionItem<MediaResponse>[] = (data.medias ?? []).map(
            (m, i) => ({
              item: m,
              order_index: i + 1,
            }),
          );
          setMediaItems(items);
          setInitialMediaIds(new Set((data.medias ?? []).map((m) => m.id)));
        }
      } finally {
        setLoading(false);
      }
    };

    loadEntity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, entityType, isEdit]);

  // Media search fetcher for JunctionFieldEditor
  const fetchMediaOptions = useCallback(async (query: string) => {
    const result = await listMedia({
      search: query || undefined,
      page: 1,
      size: 20,
    });
    return result.items;
  }, []);

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
  const createLabel =
    entityType === "letter" ? t("PAGE.CREATE_CHARACTER") : t("PAGE.CREATE_WORD");
  const editLabel =
    entityType === "letter" ? t("PAGE.EDIT_CHARACTER") : t("PAGE.EDIT_WORD");

  const breadcrumbs = [
    { label: t("FORM.DICTIONARY"), href: labels.listPath },
    {
      label: entityType === "letter" ? t("FORM.CHARACTERS") : t("FORM.WORDS"),
      href: labels.listPath,
    },
    { label: isEdit ? editLabel : createLabel },
  ];

  const pageTitle = isEdit ? editLabel : createLabel;

  return (
    <EntityFormLayout
      title={pageTitle}
      breadcrumbs={breadcrumbs}
      loading={loading}
      saving={form.isSubmitting}
      serverError={form.serverError}
      onSave={form.handleSubmit}
      onCancel={() => router.push(labels.listPath)}
      sidebar={
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {t("FORM.STATUS")}
          </Typography>
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
        <JunctionFieldEditor<MediaResponse>
          label={labels.junctionLabel}
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
            label={labels.nameEnLabel}
            value={form.values.name_en}
            onChange={(e) => form.setField("name_en", e.target.value)}
            error={!!form.errors.name_en}
            helperText={form.errors.name_en}
          />
          <TextField
            required
            fullWidth
            label={labels.nameKhLabel}
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
