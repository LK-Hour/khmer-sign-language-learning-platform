"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

// @mui
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
import { KslFontSizes } from "@/theme/theme";

// ----------------------------------------------------------------------

type PermissionRequestCloseReason =
  | "backdropClick"
  | "escapeKeyDown"
  | "closeButton";

export type PermissionRequestChoice = "agreed" | "skipped" | "dismissed";

export const DATA_IMPROVEMENT_PERMISSION_STORAGE_KEY =
  "ksl:data-improvement-permission-request";

export type PermissionRequestDialogProps = Omit<
  DialogProps,
  "children" | "onClose" | "title"
> & {
  title?: ReactNode;
  description?: ReactNode;
  checkboxLabel?: ReactNode;
  skipLabel?: string;
  agreeLabel?: string;
  storageKey?: string;
  defaultDoNotShowAgain?: boolean;
  onClose: (
    doNotShowAgain: boolean,
    reason: PermissionRequestCloseReason
  ) => void;
  onSkip: (doNotShowAgain: boolean) => void;
  onAgree: (doNotShowAgain: boolean) => void;
};

export function getPermissionRequestChoice(
  storageKey = DATA_IMPROVEMENT_PERMISSION_STORAGE_KEY
): PermissionRequestChoice | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(storageKey);

  if (
    storedValue === "agreed" ||
    storedValue === "skipped" ||
    storedValue === "dismissed"
  ) {
    return storedValue;
  }

  return null;
}

export default function PermissionRequestDialog({
  title = "Help improve the model",
  description = "Allow us to use your learning activity, feedback, and prediction results to improve Khmer Sign Language recognition.",
  checkboxLabel = "Do not show again",
  skipLabel = "Skip",
  agreeLabel = "Agree",
  storageKey = DATA_IMPROVEMENT_PERMISSION_STORAGE_KEY,
  defaultDoNotShowAgain = false,
  open,
  onClose,
  onSkip,
  onAgree,
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

  const rememberChoice = (choice: PermissionRequestChoice) => {
    if (!doNotShowAgain || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, choice);
  };

  const handleDialogClose: DialogProps["onClose"] = (_event, reason) => {
    rememberChoice("dismissed");
    onClose(doNotShowAgain, reason);
  };

  const handleSkip = () => {
    rememberChoice("skipped");
    onSkip(doNotShowAgain);
  };

  const handleAgree = () => {
    rememberChoice("agreed");
    onAgree(doNotShowAgain);
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
          px: { xs: 2, sm: 3, md: 4 },
          // py: { xs: 1.5, sm: 2, md: 2 },
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
          sx={{ m: 0 }}
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
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
