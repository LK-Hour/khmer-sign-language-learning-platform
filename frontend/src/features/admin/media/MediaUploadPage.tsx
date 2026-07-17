"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CloudUpload from "@mui/icons-material/CloudUpload";
import {
  Alert,
  Box,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEntityForm } from "../hooks/useEntityForm";
import EntityFormLayout from "../components/shared/EntityFormLayout";
import * as mediaApi from "../api/mediaAdminApi";

// ── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "video/mp4",
  "video/webm",
];

const MEDIA_TYPE_OPTIONS = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "gif", label: "GIF" },
] as const;

// ── Form payload type ────────────────────────────────────────────────────────

interface MediaUploadFormPayload {
  file: File | null;
  media_type: "video" | "gif" | "image";
  file_url: string;
}

// ── Validation ───────────────────────────────────────────────────────────────

function validate(values: MediaUploadFormPayload): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.file && !values.file_url.trim()) {
    errors.file = "Please select a file to upload or provide a file URL";
  }

  if (values.file && !ALLOWED_MIME_TYPES.includes(values.file.type)) {
    errors.file = `Unsupported file type: ${values.file.type}. Allowed: PNG, JPEG, GIF, MP4, WebM.`;
  }

  if (!values.media_type) {
    errors.media_type = "Media type is required";
  }

  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MediaUploadPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useEntityForm<MediaUploadFormPayload & Record<string, unknown>, mediaApi.MediaResponse>({
    initialValues: {
      file: null,
      media_type: "image",
      file_url: "",
    },
    validate: validate as (values: MediaUploadFormPayload & Record<string, unknown>) => Record<string, string>,
    onSubmit: async (values) => {
      if (!values.file) {
        throw new Error("Please select a file to upload");
      }
      setUploading(true);
      try {
        const response = await mediaApi.uploadMedia(values.file as File, values.media_type as string);
        return response;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      // Navigate back to media library with a success indicator
      router.push("/admin/media?success=upload");
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFileError(null);

    if (selected && !ALLOWED_MIME_TYPES.includes(selected.type)) {
      setFileError(
        `Unsupported file type: ${selected.type}. Allowed: PNG, JPEG, GIF, MP4, WebM.`,
      );
      form.setField("file", null);
      return;
    }

    form.setField("file", selected);

    // Auto-detect media type from file MIME
    if (selected) {
      if (selected.type.startsWith("video/")) {
        form.setField("media_type", "video");
      } else if (selected.type === "image/gif") {
        form.setField("media_type", "gif");
      } else {
        form.setField("media_type", "image");
      }

      // Auto-populate file_url with the file name
      form.setField("file_url", selected.name);
    }
  };

  const handleCancel = () => {
    router.push("/admin/media");
  };

  const selectedFile = form.values.file as File | null;

  // Generate a preview URL for the selected file
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const isVideoFile = selectedFile?.type.startsWith("video/");

  return (
    <EntityFormLayout
      title="Upload Media"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Media Library", href: "/admin/media" },
        { label: "Upload" },
      ]}
      saving={form.isSubmitting || uploading}
      serverError={form.serverError}
      onSave={form.handleSubmit}
      onCancel={handleCancel}
      previewPanel={
        previewUrl ? (
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Preview
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                borderRadius: 1,
                overflow: "hidden",
                bgcolor: "grey.100",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {isVideoFile ? (
                <video
                  controls
                  src={previewUrl}
                  style={{ maxWidth: "100%", maxHeight: 320 }}
                />
              ) : (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Upload preview"
                  sx={{ maxWidth: "100%", maxHeight: 320, objectFit: "contain" }}
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {selectedFile?.name} ({((selectedFile?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB)
            </Typography>
          </Stack>
        ) : undefined
      }
    >
      <Stack spacing={3}>
        {/* File Upload Input */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            File Upload <Typography component="span" color="error.main">*</Typography>
          </Typography>
          <Box
            sx={{
              border: "2px dashed",
              borderColor: form.errors.file || fileError ? "error.main" : "divider",
              borderRadius: "12px",
              p: 4,
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              transition: "border-color 0.2s, background-color 0.2s",
              "&:hover": uploading
                ? {}
                : { borderColor: "primary.main", bgcolor: "action.hover" },
            }}
            component="label"
          >
            <input
              type="file"
              hidden
              accept={ALLOWED_MIME_TYPES.join(",")}
              onChange={handleFileChange}
              disabled={uploading || form.isSubmitting}
            />
            <CloudUpload
              sx={{ fontSize: 48, color: "action.active", mb: 1 }}
            />
            <Typography variant="body1" color="text.secondary">
              {selectedFile
                ? selectedFile.name
                : "Click to select a file or drag and drop"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Supported: PNG, JPEG, GIF, MP4, WebM
            </Typography>
            {selectedFile && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </Typography>
            )}
          </Box>
          {(form.errors.file || fileError) && (
            <Typography variant="caption" color="error.main" sx={{ mt: 0.5 }}>
              {form.errors.file || fileError}
            </Typography>
          )}
        </Box>

        {/* Upload Progress */}
        {uploading && (
          <Stack spacing={1}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
              Uploading file…
            </Typography>
          </Stack>
        )}

        {/* Media Type Selection */}
        <TextField
          select
          fullWidth
          label="Media Type"
          value={form.values.media_type}
          onChange={(e) => form.setField("media_type", e.target.value)}
          disabled={uploading || form.isSubmitting}
          required
          error={Boolean(form.errors.media_type)}
          helperText={form.errors.media_type}
        >
          {MEDIA_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {/* File URL (auto-populated or manual) */}
        <TextField
          fullWidth
          label="File URL"
          placeholder="Auto-populated after upload or enter manually"
          value={form.values.file_url}
          onChange={(e) => form.setField("file_url", e.target.value)}
          disabled={uploading || form.isSubmitting}
          helperText="This will be auto-populated with the file name when a file is selected, or you can enter a URL manually."
        />

        {/* Error from server displayed inline (additional to the top-level alert) */}
        {form.serverError && (
          <Alert severity="error">
            {form.serverError}
          </Alert>
        )}
      </Stack>
    </EntityFormLayout>
  );
}
