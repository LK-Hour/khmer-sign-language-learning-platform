"use client";

import { useCallback, useRef, useState } from "react";
import { ApiError } from "@/utils/api/client";

// ── Public interfaces ────────────────────────────────────────────────────────

export interface UseEntityFormOptions<TPayload, TResponse> {
  initialValues: TPayload;
  validate: (values: TPayload) => Record<string, string>; // field → error message
  onSubmit: (values: TPayload) => Promise<TResponse>;
  onSuccess: (response: TResponse) => void; // Typically: navigate back
}

export interface UseEntityFormReturn<TPayload> {
  values: TPayload;
  errors: Record<string, string>;
  serverError: string | null;
  isDirty: boolean;
  isSubmitting: boolean;
  setField: (field: keyof TPayload, value: unknown) => void;
  setValues: (values: Partial<TPayload>) => void;
  handleSubmit: () => Promise<void>;
  reset: (values?: TPayload) => void;
}

// ── Error mapping helpers ────────────────────────────────────────────────────

export function mapApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message;
      case 409:
        return `Conflict: ${error.message}`;
      case 500:
        return "An unexpected error occurred. Please try again.";
      default:
        return error.message;
    }
  }

  // Network failure or other non-API errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "Network error — please check your connection";
  }

  if (error instanceof Error) {
    // Generic network errors (e.g. "Failed to fetch", "NetworkError", etc.)
    if (
      error.message.toLowerCase().includes("network") ||
      error.message.toLowerCase().includes("failed to fetch")
    ) {
      return "Network error — please check your connection";
    }
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

// ── Hook implementation ──────────────────────────────────────────────────────

export function useEntityForm<TPayload extends Record<string, unknown>, TResponse>(
  options: UseEntityFormOptions<TPayload, TResponse>,
): UseEntityFormReturn<TPayload> {
  const { initialValues, validate, onSubmit, onSuccess } = options;

  const [values, setValuesState] = useState<TPayload>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep a stable reference to initialValues for dirty checking
  const initialRef = useRef<TPayload>(initialValues);

  const setField = useCallback(
    (field: keyof TPayload, value: unknown) => {
      setValuesState((prev) => {
        const next = { ...prev, [field]: value };
        setIsDirty(JSON.stringify(next) !== JSON.stringify(initialRef.current));
        return next;
      });
      // Clear field-level error when user edits the field
      setErrors((prev) => {
        if (!(field in prev)) return prev;
        const { [field as string]: _, ...rest } = prev;
        return rest;
      });
      // Clear server error on any edit
      setServerError(null);
    },
    [],
  );

  const setValues = useCallback(
    (partial: Partial<TPayload>) => {
      setValuesState((prev) => {
        const next = { ...prev, ...partial };
        setIsDirty(JSON.stringify(next) !== JSON.stringify(initialRef.current));
        return next;
      });
      // Clear errors for updated fields
      setErrors((prev) => {
        const updated = { ...prev };
        for (const key of Object.keys(partial)) {
          delete updated[key];
        }
        return updated;
      });
      setServerError(null);
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    // Run client-side validation
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setServerError(null);
    setIsSubmitting(true);

    try {
      const response = await onSubmit(values);
      onSuccess(response);
    } catch (error: unknown) {
      setServerError(mapApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit, onSuccess]);

  const reset = useCallback(
    (newValues?: TPayload) => {
      const resetTo = newValues ?? initialRef.current;
      if (newValues) {
        initialRef.current = newValues;
      }
      setValuesState(resetTo);
      setErrors({});
      setServerError(null);
      setIsDirty(false);
    },
    [],
  );

  return {
    values,
    errors,
    serverError,
    isDirty,
    isSubmitting,
    setField,
    setValues,
    handleSubmit,
    reset,
  };
}
