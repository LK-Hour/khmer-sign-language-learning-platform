"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import EntityFormLayout from "../components/shared/EntityFormLayout";
import { useEntityForm } from "../hooks/useEntityForm";
import { useTranslation } from "@/i18n/useTranslation";
import * as adminApi from "../api/adminApi";
import type { AdminTrack, AdminUnit, PublishStatus } from "../api/types";

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
  is_active: boolean;
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
  const isEdit = entityId !== undefined;
  const listPath = getListPath(track);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(isEdit);
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(
    null,
  );

  // Form hook
  const form = useEntityForm<UnitFormValues, AdminUnit>({
    initialValues: {
      name_en: "",
      name_kh: "",
      description_en: "",
      description_kh: "",
      order_index: 1,
      is_active: true,
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

      if (isEdit && entityId) {
        return adminApi.updateUnit(track as AdminTrack, entityId, payload);
      }
      return adminApi.createUnit(track as AdminTrack, payload);
    },
    onSuccess: () => {
      router.push(`${listPath}?success=${isEdit ? "updated" : "created"}`);
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
        });
        setPublishStatus(data.publish_status);
      } finally {
        setLoading(false);
      }
    };

    loadUnit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, track, isEdit]);

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
                onChange={(e) =>
                  form.setField("is_active", e.target.checked)
                }
              />
            }
            label={t("FORM.ACTIVE")}
          />

          {/* Publish Status (read-only in edit mode) */}
          {isEdit && publishStatus && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 0.5 }}
              >
                {t("FORM.PUBLISH_STATUS")}
              </Typography>
              <Chip
                label={publishStatus === "published" ? t("ADMIN.PUBLISHED") : t("ADMIN.DRAFT")}
                color={publishStatus === "published" ? "success" : "default"}
                size="small"
              />
            </Box>
          )}
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
