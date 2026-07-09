"use client";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { KslColors, KslFontSizes } from "@/theme/theme";

type WordRecordingPreviewProps = {
  open: boolean;
  videoBlob: Blob | null;
  word: string;
  predictedLabel: string | null;
  confidence: number | null;
  isUploading?: boolean;
  uploadError?: string | null;
  onDiscard: (doNotShowAgain: boolean) => void;
  onUpload: (doNotShowAgain: boolean) => void;
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

  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleDiscard = () => {
    onDiscard(doNotShowAgain);
  };

  const handleUpload = () => {
    onUpload(doNotShowAgain);
  };

  return (
    <Dialog 
    fullWidth 
    maxWidth="sm" 
    open={open} 
    scroll="paper"
    onClose={isUploading ? undefined : handleDiscard} 
    sx={{ "& .MuiDialog-paper": { borderRadius: "12px" }, pb: 0, mb:0 }}>
      <DialogTitle>Review practice recording (donation)</DialogTitle>
      <DialogContent
      sx={{
        display: "flex",
        flexDirection: "column",
        py: 0,
      }}
      >
        
        <Stack spacing={1.5}>
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              muted
              autoPlay
              playsInline
              style={{
                width: "100%",
                background: "#a1f8ab",
                borderRadius: "8px",
              }}
            />
          ) : null}

          <Stack spacing={0.5}>
            <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.textSecondary }}>
              Target word
            </Typography>
            <Typography sx={{ fontSize: KslFontSizes.xl, fontWeight: 700 }}>
              {word}  
              {confidence != null ? ` ${Math.round(confidence)}%` : ""}
            </Typography>
          </Stack>

          <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.textSecondary, lineHeight: 1.6 }}>
            If you are willing to share or contribute sign language data, it would greatly help us improve the system and make it more inclusive for everyone. Together, we can make communication more accessible and impactful.
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={doNotShowAgain}
                onChange={(event) => setDoNotShowAgain(event.target.checked)}
                sx={{m:0, p:0}}
              />
            }
            label={
              <Typography sx={{ fontSize: KslFontSizes.sm }}>
                Remember my choice
              </Typography>
            }
            sx={{ m: 0}}
          />

          {uploadError ? (
            <Typography sx={{ fontSize: KslFontSizes.sm, color: KslColors.warning }}>
              {uploadError}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, justifyContent: "flex-end" }}>
        <Button 
          color="inherit" 
          onClick={handleDiscard} 
          disabled={isUploading} 
          sx={{ bgcolor: "grey.300", "&:hover": { bgcolor: "grey.500" }, borderRadius: "8px" }}
        >
          Discard
        </Button>
        <Button
          variant="contained"
          loading={isUploading}
          onClick={handleUpload}
          disabled={!videoBlob}
          sx={{ borderRadius: "8px" }}
        >
          Donate
        </Button>
      </DialogActions>
    </Dialog>
  );
}