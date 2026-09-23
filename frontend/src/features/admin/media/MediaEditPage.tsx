"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";

import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";
import { useLocale } from "@/i18n/locale-context";
import { useTranslation } from "@/i18n/useTranslation";
import { ApiError } from "@/utils/api/client";

import { listCharacters, listWords } from "../api/dictionaryAdminApi";
import {
  associateMedia,
  disassociateMedia,
  getMediaDetail,
  type MediaAssociation,
  type MediaResponse,
} from "../api/mediaAdminApi";
import EntityFormLayout from "../components/shared/EntityFormLayout";
import { useEntityForm } from "../hooks/useEntityForm";
import MediaAssociationsEditor from "./MediaAssociationsEditor";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MediaEditPageProps {
  mediaId: number;
}

interface MediaFormValues {
  /** Letters/words the media should be linked to after saving. */
  associations: MediaAssociation[];
  [key: string]: unknown;
}

const keyOf = (a: Pick<MediaAssociation, "target_type" | "target_id">) =>
  `${a.target_type}:${a.target_id}`;

/** How many suggestions the link picker asks the dictionary for at a time. */
const TARGET_SEARCH_SIZE = 20;

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Media Library edit page: the full-size preview, the asset's details, and the letters and
 * words it is linked to (add/remove, applied on Save). The file itself can't be edited.
 */
export default function MediaEditPage({ mediaId }: MediaEditPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const { t } = useTranslation();
  const listPath = `/${locale}/admin/media`;

  const [media, setMedia] = useState<MediaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Links as they currently exist on the server. Save applies the difference to these, and each
  // successful call updates them, so a retry after a failure only redoes what's left.
  const [saved, setSaved] = useState<MediaAssociation[]>([]);

  const form = useEntityForm<MediaFormValues, MediaAssociation[]>({
    initialValues: { associations: [] },
    validate: () => ({}),
    onSubmit: async (values) => {
      const wanted = new Map(values.associations.map((a) => [keyOf(a), a]));
      let current = saved;

      for (const link of saved) {
        if (wanted.has(keyOf(link))) continue;
        await disassociateMedia(mediaId, {
          target_type: link.target_type,
          target_id: link.target_id,
        });
        current = current.filter((c) => keyOf(c) !== keyOf(link));
        setSaved(current);
      }

      const existing = new Set(current.map(keyOf));
      for (const link of values.associations) {
        if (existing.has(keyOf(link))) continue;
        await associateMedia(mediaId, {
          target_type: link.target_type,
          target_id: link.target_id,
        });
        current = [...current, link];
        setSaved(current);
      }

      return current;
    },
    onSuccess: () => {
      router.push(`${listPath}?success=updated`);
    },
  });

  useEffect(() => {
    let cancelled = false;

    getMediaDetail(mediaId)
      .then((data) => {
        if (cancelled) return;
        setMedia(data);
        setSaved(data.associations);
        form.reset({ associations: data.associations });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof ApiError ? error.message : "Failed to load media details.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `form` is recreated every render; only a different media id should reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  const fetchTargets = useCallback(
    async (type: MediaAssociation["target_type"], query: string) => {
      const params = { search: query.trim() || undefined, size: TARGET_SEARCH_SIZE };
      const page = type === "letter" ? await listCharacters(params) : await listWords(params);
      return page.items;
    },
    [],
  );

  if (loadError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
      >
        {loadError}
      </Alert>
    );
  }

  const resolvedUrl = media ? (resolveApiAssetUrl(media.file_url) ?? media.file_url) : "";

  return (
    <EntityFormLayout
      title={`${t("PAGE.EDIT_MEDIA")} #${mediaId}`}
      breadcrumbs={[
        { label: t("ADMIN.MEDIA_LIBRARY"), href: listPath },
        { label: `#${mediaId}` },
      ]}
      loading={loading}
      saving={form.isSubmitting}
      serverError={form.serverError}
      onSave={form.handleSubmit}
      onCancel={() => router.push(listPath)}
      sidebar={
        media && (
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t("FORM.MEDIA_DETAILS")}
            </Typography>
            <DetailRow label="ID" value={String(media.id)} />
            <DetailRow
              label={t("ADMIN.TYPE")}
              value={
                <Chip
                  label={media.media_type}
                  size="small"
                  variant="outlined"
                  color={
                    media.media_type === "video"
                      ? "info"
                      : media.media_type === "gif"
                        ? "warning"
                        : "default"
                  }
                />
              }
            />
            <DetailRow
              label={t("ANALYTICS.FILE_URL")}
              value={
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", wordBreak: "break-all", fontSize: "0.8125rem" }}
                >
                  {media.file_url}
                </Typography>
              }
            />
            <DetailRow
              label={t("ANALYTICS.CREATED_AT")}
              value={media.created_at ? new Date(media.created_at).toLocaleString() : "—"}
            />
          </Stack>
        )
      }
      junctionSection={
        <MediaAssociationsEditor
          items={form.values.associations}
          onAdd={(item) =>
            form.setField("associations", [...form.values.associations, item])
          }
          onRemove={(item) =>
            form.setField(
              "associations",
              form.values.associations.filter((a) => keyOf(a) !== keyOf(item)),
            )
          }
          fetchTargets={fetchTargets}
        />
      }
    >
      {media && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
            p: 2,
            borderRadius: 1,
            bgcolor: "background.neutral",
          }}
        >
          {media.media_type === "video" ? (
            <video
              controls
              crossOrigin="anonymous"
              preload="metadata"
              src={resolvedUrl}
              style={{ maxWidth: "100%", maxHeight: 600, borderRadius: 8, backgroundColor: "#000" }}
            />
          ) : (
            <Box
              component="img"
              src={resolvedUrl}
              alt={`Media ${media.id}`}
              sx={{ maxWidth: "100%", height: "auto", borderRadius: 1, objectFit: "contain" }}
            />
          )}
        </Box>
      )}
    </EntityFormLayout>
  );
}

// ── Internal ─────────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ gap: 1, alignItems: "flex-start" }}>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.8125rem", minWidth: 80 }}
      >
        {label}:
      </Typography>
      {typeof value === "string" ? (
        <Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
          {value}
        </Typography>
      ) : (
        value
      )}
    </Stack>
  );
}
