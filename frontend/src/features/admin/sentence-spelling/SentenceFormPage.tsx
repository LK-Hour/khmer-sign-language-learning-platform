"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";

import EntityFormLayout from "../components/shared/EntityFormLayout";
import { useEntityForm } from "../hooks/useEntityForm";
import { useTranslation } from "@/i18n/useTranslation";
import { useLocale } from "@/i18n/locale-context";
import { sanitizeKhmerInput } from "@/features/sentence-spelling/utils/khmerInput";
import {
  getSentence,
  createSentence,
  updateSentence,
  type SentencePayload,
} from "../api/sentenceSpellingAdminApi";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SentenceFormPageProps {
  entityId?: number; // Provided in edit mode
}

interface SentenceFormValues {
  text_kh: string;
  text_en: string;
  is_active: boolean;
  [key: string]: unknown;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function validate(values: SentenceFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.text_kh.trim()) {
    errors.text_kh = "Sentence (KH) is required";
  }
  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SentenceFormPage({ entityId }: SentenceFormPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const { t } = useTranslation();
  const isEdit = entityId !== undefined;
  const listPath = `/${locale}/admin/sentence-spelling`;

  const [loading, setLoading] = useState(isEdit);

  const form = useEntityForm<SentenceFormValues, unknown>({
    initialValues: {
      text_kh: "",
      text_en: "",
      is_active: true,
    },
    validate,
    onSubmit: async (values) => {
      const payload: SentencePayload = {
        text_kh: values.text_kh,
        text_en: values.text_en || null,
        is_active: values.is_active,
      };

      if (isEdit && entityId) {
        await updateSentence(entityId, payload);
      } else {
        await createSentence(payload);
      }
    },
    onSuccess: () => {
      router.push(`${listPath}?success=${isEdit ? "updated" : "created"}`);
    },
  });

  // Load existing data in edit mode
  useEffect(() => {
    if (!isEdit || !entityId) return;

    const loadEntity = async () => {
      setLoading(true);
      try {
        const data = await getSentence(entityId);
        form.reset({
          text_kh: data.text_kh ?? "",
          text_en: data.text_en ?? "",
          is_active: data.is_active,
        });
      } finally {
        setLoading(false);
      }
    };

    loadEntity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, isEdit]);

  const pageTitle = isEdit ? "Edit Sentence" : "Create Sentence";
  const breadcrumbs = [
    { label: "Sentence Spelling", href: listPath },
    { label: pageTitle },
  ];

  return (
    <EntityFormLayout
      title={pageTitle}
      breadcrumbs={breadcrumbs}
      loading={loading}
      saving={form.isSubmitting}
      serverError={form.serverError}
      onSave={form.handleSubmit}
      onCancel={() => router.push(listPath)}
      statusSection={
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
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
    >
      <Stack spacing={3}>
        <TextField
          required
          fullWidth
          multiline
          minRows={2}
          label="Sentence (KH)"
          helperText={form.errors.text_kh ?? "Khmer characters and Khmer numerals only"}
          error={!!form.errors.text_kh}
          value={form.values.text_kh}
          onChange={(e) => form.setField("text_kh", sanitizeKhmerInput(e.target.value))}
          slotProps={{ htmlInput: { lang: "km" } }}
        />
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Sentence (EN)-gloss / translation"
          value={form.values.text_en}
          onChange={(e) => form.setField("text_en", e.target.value)}
        />
      </Stack>
    </EntityFormLayout>
  );
}
