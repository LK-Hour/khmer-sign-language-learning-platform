"use client";

import type { ReactNode } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { SxProps, Theme } from "@mui/material/styles";

export interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onSubmit: () => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  sx?: SxProps<Theme>;
}

export default function FormDialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  loading = false,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  sx,
}: FormDialogProps) {
  const handleSubmit = async () => {
    await onSubmit();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(28, 37, 46, 0.5)",
          },
        },
        paper: {
          sx: {
            borderRadius: "16px",
            ...sx,
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Box>
            <Typography variant="h6" component="span">
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={onClose}
            disabled={loading}
            size="small"
            aria-label="close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Content: responsive grid for form fields */}
      <DialogContent sx={{ pt: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          {children}
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          variant="text"
          color="inherit"
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" /> : undefined
          }
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
