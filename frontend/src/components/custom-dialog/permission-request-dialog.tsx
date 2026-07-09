"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

// @mui
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { KslColors, KslFontSizes } from "@/theme/theme";

// ----------------------------------------------------------------------

type PermissionRequestCloseReason =
  | "backdropClick"
  | "escapeKeyDown"
  | "closeButton";

export type PermissionRequestDialogProps = Omit<
  DialogProps,
  "children" | "onClose" | "title"
> & {
  title?: ReactNode;
  description?: ReactNode;
  videoUrl?: string;
  targetLabel?: string;
  targetConfidence?: number;
  checkboxLabel?: ReactNode;
  skipLabel?: string;
  agreeLabel?: string;
  donateLabel?: string;
  defaultDoNotShowAgain?: boolean;
  onClose: (
    doNotShowAgain: boolean,
    reason: PermissionRequestCloseReason
  ) => void;
  onSkip: (doNotShowAgain: boolean) => void;
  onAgree: (doNotShowAgain: boolean) => void;
  onDonate?: (doNotShowAgain: boolean) => void;
};

export default function PermissionRequestDialog({
  title = "Help improve the model",
  description = "Allow us to use your learning activity, feedback, and prediction results to improve Khmer Sign Language recognition.",
  videoUrl,
  targetLabel,
  targetConfidence,
  checkboxLabel = "Do not show again",
  skipLabel = "Skip",
  agreeLabel = "Agree",
  donateLabel = "Donate My Data",
  defaultDoNotShowAgain = false,
  open,
  onClose,
  onSkip,
  onAgree,
  onDonate,
  ...other
}: PermissionRequestDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  const descriptionElementRef = useRef<HTMLElement>(null);

  const [doNotShowAgain, setDoNotShowAgain] = useState(
    defaultDoNotShowAgain
  );

  useEffect(() => {
    if (!open) return;

    const descriptionElement = descriptionElementRef.current;

    if (descriptionElement) {
      descriptionElement.focus();
    }
  }, [open]);

  const handleDialogClose: DialogProps["onClose"] = (_event, reason) => {
    onClose(doNotShowAgain, reason);
  };

  const handleSkip = () => {
    onSkip(doNotShowAgain);
  };

  const handleAgree = () => {
    onAgree(doNotShowAgain);
  };

  const handleDonate = () => {
    onDonate?.(doNotShowAgain);
  };

  return (
    <Dialog
      {...other}
      open={open}
      onClose={handleDialogClose}
      scroll="paper"
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      slotProps={{
        paper: {
          sx: {
            width: {
              sm: '75%'
            },
            mx: { xs: 1.5, sm: 3 },
          },
        },
      }}
    >
      <DialogTitle
        id={titleId}
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2, sm: 2.5, md: 3 },
          pb: { xs: 1, sm: 1.5 },
          fontSize: { xs: KslFontSizes.md, sm: KslFontSizes.lg },
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          pb: 0,
        }}
      >
        <DialogContentText
          id={descriptionId}
          ref={descriptionElementRef}
          tabIndex={-1}
          sx={{
            mb: 0,
            fontSize: { xs: KslFontSizes.sm, sm: KslFontSizes.md },
            lineHeight: 1.5,
            whiteSpace: "pre-line",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            outline: "none",
          }}
        >
          {description}
        </DialogContentText>

        {videoUrl && (
          <Box
            sx={{
              mt: 2,
              mb: 1.5,
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "black",
              lineHeight: 0,
            }}
          >
            <video
              src={videoUrl}
              controls
              autoPlay
              muted
              playsInline
              style={{ width: "100%", display: "block", maxHeight: 320 }}
            />
          </Box>
        )}

        {(targetLabel || targetConfidence != null) && (
          <Box
            sx={{
              mt: 2,
              mb: 1.5,
              p: 2,
              bgcolor: KslColors.primaryLighter,
              borderRadius: 1,
              border: `1px solid`,
              borderColor: KslColors.primaryLight,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: KslColors.textSecondary,
                mb: 0.5,
                fontSize: { xs: KslFontSizes.sm, sm: KslFontSizes.md },
              }}
            >
              Target Word
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: KslFontSizes.md, sm: KslFontSizes.lg },
                mb: targetConfidence != null ? 0.5 : 0,
              }}
            >
              {targetLabel}
            </Typography>
            {targetConfidence != null && (
              <Typography
                variant="body2"
                sx={{
                  color: KslColors.textSecondary,
                  fontWeight: 600,
                  fontSize: { xs: KslFontSizes.sm, sm: KslFontSizes.md },
                }}
              >
                Confidence: {targetConfidence}%
              </Typography>
            )}
          </Box>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={doNotShowAgain}
              onChange={(event) => setDoNotShowAgain(event.target.checked)}
            />
          }
          label={
            <Typography sx={{ fontSize: { xs: KslFontSizes.sm, sm: KslFontSizes.md } }}>
              {checkboxLabel}
            </Typography>
          }
          sx={{ m: 0, px: 0 }}
        />
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1.5, sm: 2, md: 2.5 },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1, sm: 1.5 }}
          sx={{ width: "100%" }}
        >
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            onClick={handleSkip}
            sx={{ minHeight: { xs: 44, sm: 48 } }}
          >
            {skipLabel}
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleAgree}
            sx={{ minHeight: { xs: 44, sm: 48 } }}
          >
            {agreeLabel}
          </Button>
          {onDonate ? (
            <Button
              fullWidth
              variant="outlined"
              onClick={handleDonate}
              sx={{ minHeight: { xs: 44, sm: 48 } }}
            >
              {donateLabel}
            </Button>
          ) : null}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}