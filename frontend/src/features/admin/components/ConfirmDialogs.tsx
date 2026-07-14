"use client";

import Publish from "@mui/icons-material/Publish";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";

import { ActiveChip, PublishChip } from "./StatusChips";

type ConfirmActionDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: "primary" | "error" | "success";
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Generic confirmation modal (delete / restore). */
export function ConfirmActionDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmColor = "primary",
  busy = false,
  onClose,
  onConfirm,
}: ConfirmActionDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          {t("BUTTON.CANCEL")}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={busy}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type PublishConfirmDialogProps = {
  open: boolean;
  entityLabel: string;
  nameEn: string;
  nameKh?: string | null;
  isActive: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Confirm-publish modal with a change summary (entity, name, intended state). */
export function PublishConfirmDialog({
  open,
  entityLabel,
  nameEn,
  nameKh,
  isActive,
  busy = false,
  onClose,
  onConfirm,
}: PublishConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {t("ADMIN.PUBLISH_CONFIRM_TITLE")}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
            {t("ADMIN.PUBLISH_CONFIRM_MESSAGE")}
          </Typography>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
            <Stack spacing={1}>
              <Typography
                sx={{
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "text.secondary",
                }}
              >
                {entityLabel}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "text.primary",
                }}
              >
                {nameEn}
                {nameKh ? ` · ${nameKh}` : ""}
              </Typography>
              <Stack direction="row" spacing={1}>
                <ActiveChip active={isActive} />
                <PublishChip status="draft" />
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                  →
                </Typography>
                <PublishChip status="published" />
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          {t("BUTTON.CANCEL")}
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<Publish />}
          onClick={onConfirm}
          disabled={busy}
        >
          {t("ADMIN.CONFIRM_PUBLISH")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
