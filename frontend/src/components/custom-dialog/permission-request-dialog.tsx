"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

// @mui
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { TransitionProps } from "@mui/material/transitions";

// theme
import { KslFontSizes } from "@/theme/theme";

// ----------------------------------------------------------------------

type PermissionRequestCloseReason =
  | "backdropClick"
  | "escapeKeyDown"
  | "closeButton";

export type PermissionRequestChoice = "agreed" | "skipped" | "dismissed";

export const DATA_IMPROVEMENT_PERMISSION_STORAGE_KEY =
  "ksl:data-improvement-permission-request";

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export type PermissionRequestDialogProps = Omit<
  DialogProps,
  "children" | "onClose" | "title" | "scroll"
> & {
  title?: ReactNode;
  description?: ReactNode;
  checkboxLabel?: ReactNode;
  skipLabel?: string;
  agreeLabel?: string;
  closeLabel?: string;
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
  closeLabel = "Close dialog",
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

  const handleCloseButton = () => {
    rememberChoice("dismissed");
    onClose(doNotShowAgain, "closeButton");
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
      fullWidth
      maxWidth="xs"
      open={open}
      onClose={handleDialogClose}
      scroll="paper"
      keepMounted
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      slots={{
        transition: Transition,
      }}
      slotProps={{
        paper: {
          sx: {
            mx: 2,
            borderRadius: "12px",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          pb: 1,
        }}
      >
        <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            id={titleId}
            component="h2"
            variant="h6"
            sx={{
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {title}
          </Typography>

          <Typography
            id={descriptionId}
            ref={descriptionElementRef}
            tabIndex={-1}
            sx={{
              color: "text.secondary",
              fontSize: KslFontSizes.sm,
              lineHeight: 1.5,
              outline: "none",
              overflowWrap: "anywhere",
            }}
          >
            {description}
          </Typography>
        </Stack>

        <IconButton
          aria-label={closeLabel}
          size="small"
          onClick={handleCloseButton}
          sx={{ mt: -0.5, flexShrink: 0 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers={scroll === 'paper' }>
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={doNotShowAgain}
                onChange={(event) => setDoNotShowAgain(event.target.checked)}
              />
            }
            label={
              <Typography sx={{ fontSize: KslFontSizes.sm }}>
                {checkboxLabel}
              </Typography>
            }
            sx={{ m: 0, minWidth: 0 }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleSkip}
          sx={{ minWidth: 96 }}
        >
          {skipLabel}
        </Button>

        <Button
          variant="contained"
          onClick={handleAgree}
          sx={{ minWidth: 96 }}
        >
          {agreeLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}