"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Stack, TextField } from "@mui/material";

import EntityFormLayout from "../components/shared/EntityFormLayout";
import PublishStatusSwitch from "../components/shared/PublishStatusSwitch";
import RelatedItemsField from "../components/shared/RelatedItemsField";
import RelationshipSection from "../components/shared/RelationshipSection";
import { useChildAttachments } from "../hooks/useChildAttachments";
import { useEntityForm } from "../hooks/useEntityForm";
import { useTranslation } from "@/i18n/useTranslation";
import { useLocale } from "@/i18n/locale-context";
import { getLocalizedPair } from "@/i18n/localizedText";
import * as adminApi from "../api/adminApi";
import type { AdminChapter, AdminTrack, AdminUnit } from "../api/types";
import { publishAfterSave } from "./publishAfterSave";
import { curriculumEditPath, matchesName, toRelatedItem } from "./relatedItems";

// ── Types ────────────────────────────────────────────────────────────────────

export type UnitTrack = "finger" | "word_detection";

export interface UnitFormPageProps {
  track: UnitTrack;
  entityId?: number; // Provided in edit mode
}

interface UnitFormValues {
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


function getListPath(track: UnitTrack): string {
  return track === "finger"
    ? "/admin/learning/finger-spelling/units"
    : "/admin/learning/word-detection/units";
}

function validate(values: UnitFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name_en.trim()) {
    errors.name_en = "Name (EN) is required";
  }
  if (!values.name_kh.trim()) {
    errors.name_kh = "Name (KH) is required";
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

export default function UnitFormPage({ track, entityId }: UnitFormPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const isEdit = entityId !== undefined;
  const listPath = `/${locale}${getListPath(track)}`;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(isEdit);
  // Id of the saved row. Set after the first successful save so that a retry (e.g. after a
  // failed publish) updates the row instead of creating a duplicate.
  const savedIdRef = useRef<number | undefined>(entityId);

  // Chapters under this unit, plus existing chapters chosen to be moved here on save.
  const chapters = useChildAttachments<AdminChapter>({
    parentId: entityId,
    load: async (unitId) =>
      (await adminApi.listChapters(track as AdminTrack, unitId)).filter((c) => c.is_active),
    attach: (chapter, unitId, orderIndex) =>
      adminApi.updateChapter(track as AdminTrack, chapter.id, {
        unit_id: unitId,
        order_index: orderIndex,
      }),
  });

  // Form hook
  const form = useEntityForm<UnitFormValues, AdminUnit>({
    initialValues: {
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
      const payload = {
        name_en: values.name_en,
        name_kh: values.name_kh,
        description_en: values.description_en || null,
        description_kh: values.description_kh || null,
        order_index: values.order_index,
      };

      // Saving always leaves the row as a draft; publishing is a separate confirm call.
      const existingId = savedIdRef.current;
      const saved = existingId
        ? await adminApi.updateUnit(track as AdminTrack, existingId, payload)
        : await adminApi.createUnit(track as AdminTrack, payload);
      savedIdRef.current = saved.id;

      await chapters.attachPending(saved.id);

      if (!values.is_published) return saved;
      return publishAfterSave(() => adminApi.publishUnit(track as AdminTrack, saved.id));
    },
    onSuccess: (saved) => {
      const outcome =
        saved.publish_status === "published" ? "published" : isEdit ? "updated" : "created";
      router.push(`${listPath}?success=${outcome}`);
    },
  });

  // Load existing data in edit mode
  useEffect(() => {
    if (!isEdit || !entityId) return;

    const loadUnit = async () => {
      setLoading(true);
      try {
        const data = await adminApi.getUnit(track as AdminTrack, entityId);
        form.reset({
          name_en: data.name_en ?? "",
          name_kh: data.name_kh ?? "",
          description_en: data.description_en ?? "",
          description_kh: data.description_kh ?? "",
          order_index: data.order_index,
          is_active: data.is_active,
          is_published: data.publish_status === "published" && data.is_active,
        });
      } finally {
        setLoading(false);
      }
    };

    loadUnit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, track, isEdit]);

  // Candidates for "Add existing chapter": active chapters of other units, with where they are now.
  const fetchChapterCandidates = useCallback(
    async (query: string) => {
      const [allChapters, units] = await Promise.all([
        adminApi.listChapters(track as AdminTrack),
        adminApi.listUnits(track as AdminTrack),
      ]);
      const unitNames = new Map(
        units.map((u) => [u.id, getLocalizedPair(locale, u.name_en, u.name_kh).primary]),
      );
      return allChapters
        .filter((c) => c.is_active && c.unit_id !== entityId && matchesName(c, query))
        .map((c) =>
          toRelatedItem(c, locale, {
            note: `${t("FORM.RELATED_CURRENTLY_IN")} ${unitNames.get(c.unit_id) ?? `#${c.unit_id}`}`,
          }),
        );
    },
    [track, locale, entityId, t],
  );

  // Breadcrumbs
  const trackLabel = track === "finger" ? t("ADMIN.TRACK_FINGER") : t("ADMIN.TRACK_WORD_DETECTION");
  const breadcrumbs = [
    { label: trackLabel, href: listPath },
    { label: t("FORM.UNITS"), href: listPath },
    { label: isEdit ? t("PAGE.EDIT_UNIT") : t("PAGE.CREATE_UNIT") },
  ];

  const pageTitle = isEdit ? t("PAGE.EDIT_UNIT") : t("PAGE.CREATE_UNIT");

  return (
    <EntityFormLayout
      title={pageTitle}
      breadcrumbs={breadcrumbs}
      loading={loading}
      saving={form.isSubmitting}
      serverError={form.serverError}
      onSave={form.handleSubmit}
      onCancel={() => router.push(listPath)}
      junctionSection={
        <RelationshipSection>
          <RelatedItemsField<AdminChapter>
            label={t("FORM.CHAPTERS")}
            addLabel={t("FORM.RELATED_ADD_CHAPTER")}
            items={chapters.items.map((c) =>
              toRelatedItem(c, locale, {
                href: curriculumEditPath(locale, track, "chapters", c.id),
              }),
            )}
            pending={chapters.pending.map((c) => toRelatedItem(c, locale))}
            loading={chapters.loading}
            onAttach={(item) => chapters.stage(item.source)}
            onUndoAttach={(item) => chapters.unstage(item.source)}
            fetchCandidates={fetchChapterCandidates}
          />
        </RelationshipSection>
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

          {/* Publish Status: applied on Save (save as draft, then publish if on) */}
          <PublishStatusSwitch
            checked={form.values.is_published}
            onChange={(published) => form.setField("is_published", published)}
            inactive={!form.values.is_active}
          />
        </Stack>
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
