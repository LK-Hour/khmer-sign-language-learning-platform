"use client";

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
import { useState } from "react";

import * as mediaApi from "../api/mediaAdminApi";
import { ApiError } from "@/utils/api/client";
import FormDialog from "../components/shared/FormDialog";

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "video/mp4",
  "video/webm",
];

interface MediaUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/** File picker dialog with MIME type validation and upload progress using FormDialog layout. */
export default function MediaUploadDialog({ open, onClose, onSuccess }: MediaUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<string>("image");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError(null);

    if (selected && !ALLOWED_MIME_TYPES.includes(selected.type)) {
      setError(`Unsupported file type: ${selected.type}. Allowed: PNG, JPEG, GIF, MP4, WebM.`);
      setFile(null);
      return;
    }

    setFile(selected);

    // Auto-detect media type from file MIME
    if (selected) {
      if (selected.type.startsWith("video/")) {
        setMediaType("video");
      } else if (selected.type === "image/gif") {
        setMediaType("gif");
      } else {
        setMediaType("image");
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await mediaApi.uploadMedia(file, mediaType);
      handleReset();
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setMediaType("image");
    setError(null);
    setUploading(false);
  };

  const handleClose = () => {
    if (!uploading) {
      handleReset();
      onClose();
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title="Upload Media"
      subtitle="Upload images, videos, or GIFs to the media library"
      onSubmit={handleSubmit}
      loading={uploading}
      submitLabel={uploading ? "Uploading..." : "Upload"}
      cancelLabel="Cancel"
    >
      {error && (
        <Alert severity="error" sx={{ gridColumn: "1 / -1" }}>
          {error}
        </Alert>
      )}

      {/* File Picker */}
      <Box
        sx={{
          gridColumn: "1 / -1",
          border: "2px dashed",
          borderColor: "divider",
          borderRadius: "12px",
          p: 3,
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.2s, background-color 0.2s",
          "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
        }}
        component="label"
      >
        <input
          type="file"
          hidden
          accept={ALLOWED_MIME_TYPES.join(",")}
          onChange={handleFileChange}
          disabled={uploading}
        />
        <CloudUpload sx={{ fontSize: 40, color: "action.active", mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {file ? file.name : "Click to select a file or drag and drop"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supported: PNG, JPEG, GIF, MP4, WebM
        </Typography>
      </Box>

      {/* Media Type Selector */}
      <TextField
        select
        fullWidth
        size="small"
        label="Media Type"
        value={mediaType}
        onChange={(e) => setMediaType(e.target.value)}
        disabled={uploading}
        sx={{ gridColumn: "1 / -1" }}
      >
        <MenuItem value="image">Image</MenuItem>
        <MenuItem value="video">Video</MenuItem>
        <MenuItem value="gif">GIF</MenuItem>
      </TextField>

      {/* Upload Progress */}
      {uploading && (
        <Stack spacing={1} sx={{ alignItems: "center", gridColumn: "1 / -1" }}>
          <LinearProgress sx={{ width: "100%" }} />
          <Typography variant="caption" color="text.secondary">
            Uploading...
          </Typography>
        </Stack>
      )}
    </FormDialog>
  );
}
