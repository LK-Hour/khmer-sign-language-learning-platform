"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo } from "react";
import { KslColors, KslFontSizes } from "@/theme/theme";

type WordRecordingPreviewProps = {
  open: boolean;
  videoBlob: Blob | null;
  word: string;
  predictedLabel: string | null;
  confidence: number | null;
  isUploading?: boolean;
  uploadError?: string | null;
  onDiscard: () => void;
  onUpload: () => void;
};

export default function WordRecordingPreview({
  open,
  videoBlob,
  word,
  predictedLabel,
  confidence,
  isUploading = false,
  uploadError = null,
  onDiscard,
  onUpload,
}: WordRecordingPreviewProps) {
  const videoUrl = useMemo(() => {
    if (!videoBlob) return null;
    return URL.createObjectURL(videoBlob);
  }, [videoBlob]);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={isUploading ? undefined : onDiscard}>
      <DialogTitle>Review practice recording</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              playsInline
              style={{
                width: "100%",
                maxHeight: 360,
                background: "#111",
                borderRadius: 8,
              }}
            />
          ) : null}

          <Stack spacing={0.5}>
            <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.textSecondary }}>
              Target word
            </Typography>
            <Typography sx={{ fontSize: KslFontSizes.xl, fontWeight: 700 }}>
              {word}
            </Typography>
          </Stack>

          <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.textSecondary }}>
            Prediction: {predictedLabel ?? "-"}
            {confidence != null ? ` (${Math.round(confidence)}%)` : ""}
          </Typography>

          {uploadError ? (
            <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.warning }}>
              {uploadError}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onDiscard} disabled={isUploading}>
          Discard
        </Button>
        <LoadingButton
          variant="contained"
          loading={isUploading}
          onClick={onUpload}
          disabled={!videoBlob}
        >
          Keep & Upload
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
