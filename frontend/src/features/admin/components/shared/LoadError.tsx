"use client";

import { Alert, Button } from "@mui/material";
import LostDatabaseConnectionView from "@/components/LostDatabaseConnectionView";
import { ApiError, isServiceUnavailable } from "@/utils/api/client";

/** Stored in an `error` string state to mean "the backend/database is down". */
export const SERVICE_UNAVAILABLE_ERROR = "service_unavailable";

/** Error-state text for a failed load: the sentinel for an outage, else the API message. */
export function loadErrorState(err: unknown, fallback: string): string {
  if (isServiceUnavailable(err)) return SERVICE_UNAVAILABLE_ERROR;
  return err instanceof ApiError ? err.message : fallback;
}

type LoadErrorProps = {
  error: string;
  onRetry: () => void;
};

/** Lost-connection view for an outage, otherwise the regular error alert with Retry. */
export default function LoadError({ error, onRetry }: LoadErrorProps) {
  if (error === SERVICE_UNAVAILABLE_ERROR) {
    return <LostDatabaseConnectionView onRetry={onRetry} />;
  }

  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      }
    >
      {error}
    </Alert>
  );
}
