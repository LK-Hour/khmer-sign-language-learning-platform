"use client";

import ArrowBack from "@mui/icons-material/ArrowBack";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Link as MuiLink,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import NextLink from "next/link";

import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";

import type { MediaAssociation, MediaResponse } from "../api/mediaAdminApi";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MediaPreviewViewProps {
  media: MediaResponse;
  associations: MediaAssociation[];
}

// ── Helper: build edit link for an association ───────────────────────────────

function getAssociationEditLink(assoc: MediaAssociation): string {
  switch (assoc.target_type) {
    case "letter":
      return `/admin/dictionary/characters/${assoc.target_id}/edit`;
    case "word":
      return `/admin/dictionary/words/${assoc.target_id}/edit`;
    default:
      return "#";
  }
}

// ── Helper: format association type label ────────────────────────────────────

function getAssociationTypeLabel(type: string): string {
  switch (type) {
    case "letter":
      return "Letter";
    case "word":
      return "Word";
    case "exercise":
      return "Exercise";
    default:
      return type;
  }
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

export function MediaPreviewSkeleton() {
  return (
    <Stack spacing={3}>
      <Skeleton variant="text" width={200} height={40} />
      <Skeleton variant="rounded" height={400} />
      <Skeleton variant="rounded" height={200} />
    </Stack>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MediaPreviewView({
  media,
  associations,
}: MediaPreviewViewProps) {
  const resolvedUrl = resolveApiAssetUrl(media.file_url) ?? media.file_url;

  return (
    <Box>
      {/* Back button */}
      <Button
        component={NextLink}
        href="/admin/media"
        startIcon={<ArrowBack />}
        sx={{ mb: 3 }}
      >
        Back to Library
      </Button>

      {/* Page title */}
      <Typography variant="h4" sx={{ mb: 3 }}>
        Media Preview
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 3,
        }}
      >
        {/* Media Display */}
        <Card>
          <CardContent
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 3,
              minHeight: 300,
              bgcolor: "grey.50",
            }}
          >
            {media.media_type === "video" ? (
              <video
                controls
                crossOrigin="anonymous"
                preload="metadata"
                src={resolvedUrl}
                style={{
                  maxWidth: "100%",
                  maxHeight: 600,
                  borderRadius: 8,
                  backgroundColor: "#000",
                }}
              />
            ) : (
              <Box
                component="img"
                src={resolvedUrl}
                alt={`Media ${media.id}`}
                sx={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: 1,
                  objectFit: "contain",
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Metadata Panel */}
        <Stack spacing={3}>
          {/* Metadata Card */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                Metadata
              </Typography>

              <Stack spacing={1.5}>
                <MetadataRow label="ID" value={String(media.id)} />
                <MetadataRow
                  label="Media Type"
                  value={
                    <Chip
                      label={media.media_type}
                      size="small"
                      color={
                        media.media_type === "video"
                          ? "info"
                          : media.media_type === "gif"
                            ? "warning"
                            : "default"
                      }
                      variant="outlined"
                    />
                  }
                />
                <MetadataRow
                  label="File URL"
                  value={
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        wordBreak: "break-all",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {media.file_url}
                    </Typography>
                  }
                />
                <MetadataRow
                  label="Created At"
                  value={
                    media.created_at
                      ? new Date(media.created_at).toLocaleString()
                      : "—"
                  }
                />
                <MetadataRow
                  label="Updated At"
                  value={
                    (media as MediaResponseWithUpdatedAt).updated_at
                      ? new Date(
                          (media as MediaResponseWithUpdatedAt).updated_at!,
                        ).toLocaleString()
                      : "—"
                  }
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Associations Card */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                Associated Entities ({associations.length})
              </Typography>

              {associations.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  No associated entities. This media is not linked to any
                  letters, words, or exercises.
                </Typography>
              ) : (
                <Stack spacing={1} divider={<Divider />}>
                  {associations.map((assoc) => (
                    <Stack
                      key={`${assoc.target_type}-${assoc.target_id}`}
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 0.5,
                      }}
                    >
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Chip
                          label={getAssociationTypeLabel(assoc.target_type)}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        <Typography variant="body2">
                          {assoc.target_name}
                        </Typography>
                      </Stack>
                      <MuiLink
                        component={NextLink}
                        href={getAssociationEditLink(assoc)}
                        underline="hover"
                        sx={{ fontSize: "0.8125rem" }}
                      >
                        Edit
                      </MuiLink>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}

// ── Internal Components ──────────────────────────────────────────────────────

interface MetadataRowProps {
  label: string;
  value: React.ReactNode;
}

function MetadataRow({ label, value }: MetadataRowProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          minWidth: 90,
          fontSize: "0.8125rem",
          fontWeight: 600,
        }}
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

// ── Extended type for updated_at (API may or may not include it) ─────────────

interface MediaResponseWithUpdatedAt extends MediaResponse {
  updated_at?: string;
}
