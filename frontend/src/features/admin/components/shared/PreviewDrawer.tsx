"use client";

import Close from "@mui/icons-material/Close";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PreviewField {
  label: string;
  value: ReactNode;
}

export interface PreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Optional media (image/video) rendered at the top of the drawer. */
  media?: ReactNode;
  fields: PreviewField[];
  /** Extra content rendered below the field list (e.g. action buttons). */
  footer?: ReactNode;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Generic read-only slide-out drawer used for the "Preview" row action
 * across admin tables that don't have a dedicated full-page preview route.
 */
export default function PreviewDrawer({
  open,
  onClose,
  title,
  subtitle,
  media,
  fields,
  footer,
}: PreviewDrawerProps) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Stack
        sx={{
          width: { xs: "100%", sm: 420 },
          p: 3,
          bgcolor: "background.paper",
          height: "100%",
        }}
        spacing={2}
      >
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Stack>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                {subtitle}
              </Typography>
            )}
          </Stack>
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </Stack>

        <Divider sx={{ borderStyle: "dashed" }} />

        {media && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 160,
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "grey.100",
            }}
          >
            {media}
          </Box>
        )}

        <Box>
          {fields.map((field, index) => (
            <Stack
              key={index}
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                py: 1,
                gap: 2,
                borderBottom: (t) => `1px dashed ${t.palette.divider}`,
              }}
            >
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", flexShrink: 0 }}>
                {field.label}
              </Typography>
              {typeof field.value === "string" || typeof field.value === "number" ? (
                <Typography sx={{ fontSize: "0.8125rem", color: "text.primary", textAlign: "right" }}>
                  {field.value}
                </Typography>
              ) : (
                field.value
              )}
            </Stack>
          ))}
        </Box>

        {footer && (
          <>
            <Divider sx={{ borderStyle: "dashed" }} />
            {footer}
          </>
        )}
      </Stack>
    </Drawer>
  );
}
