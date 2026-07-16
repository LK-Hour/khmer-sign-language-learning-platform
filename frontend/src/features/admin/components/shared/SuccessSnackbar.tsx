"use client";

import { Alert, Snackbar } from "@mui/material";
import { useSuccessNotification } from "../../hooks/useSuccessNotification";

/**
 * Drop-in component for list pages that displays a success notification
 * when the page is navigated to with a `?success=<action>` URL param.
 *
 * Usage: Simply render `<SuccessSnackbar />` inside any list page.
 */
export default function SuccessSnackbar() {
  const { open, message, handleClose } = useSuccessNotification();

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={handleClose}
        severity="success"
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
