"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

export type SuccessAction = "created" | "updated" | "upload" | "approved" | "rejected";

interface UseSuccessNotificationReturn {
  /** Whether the snackbar should be shown */
  open: boolean;
  /** The notification message to display */
  message: string;
  /** Close the snackbar and clear the URL param */
  handleClose: () => void;
}

// ── Message map ──────────────────────────────────────────────────────────────

const SUCCESS_MESSAGES: Record<SuccessAction, string> = {
  created: "Record created successfully",
  updated: "Record updated successfully",
  upload: "File uploaded successfully",
  approved: "Contribution approved successfully",
  rejected: "Contribution rejected successfully",
};

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Detects a `?success=<action>` URL search param on mount and provides
 * state to drive a MUI Snackbar. Automatically clears the param from
 * the URL (using replaceState to avoid a navigation) after reading it.
 */
export function useSuccessNotification(): UseSuccessNotificationReturn {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const successParam = searchParams.get("success") as SuccessAction | null;
    if (successParam && SUCCESS_MESSAGES[successParam]) {
      setMessage(SUCCESS_MESSAGES[successParam]);
      setOpen(true);

      // Remove the ?success param from URL without triggering a navigation
      const params = new URLSearchParams(searchParams.toString());
      params.delete("success");
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      window.history.replaceState(null, "", newUrl);
    }
  }, [searchParams, pathname]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return { open, message, handleClose };
}
