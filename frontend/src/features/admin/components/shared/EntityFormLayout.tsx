"use client";

import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

// ── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href?: string; // Optional link; last item has no href
}

export interface EntityFormLayoutProps {
  title: string; // Page title (e.g., "Create Unit")
  breadcrumbs: BreadcrumbItem[]; // Navigation breadcrumb chain
  loading?: boolean; // Shows skeleton when loading edit data
  saving?: boolean; // Disables buttons during save
  serverError?: string | null; // Server-returned error displayed at top
  onSave: () => void | Promise<void>; // Save action
  onCancel: () => void; // Cancel/back navigation
  children: ReactNode; // Main form content (left/primary area)
  /** Right-hand column content — media preview (image/video), takes priority over `sidebar`. */
  previewPanel?: ReactNode;
  sidebar?: ReactNode; // Sidebar content (order_index, metadata — no toggles)
  /** Full-width section rendered below the main grid, above junctionSection — typically the publish/active toggle. */
  statusSection?: ReactNode;
  junctionSection?: ReactNode; // Below-form section for junction editors
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function FormSkeleton() {
  return (
    <Stack spacing={3}>
      {/* Title skeleton */}
      <Skeleton variant="text" width={200} height={40} />

      {/* Two-column grid skeleton */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 3,
        }}
      >
        {/* Main card skeleton */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Skeleton variant="rounded" height={56} />
                <Skeleton variant="rounded" height={56} />
              </Box>
              <Skeleton variant="rounded" height={100} />
              <Skeleton variant="rounded" height={100} />
            </Stack>
          </CardContent>
        </Card>

        {/* Sidebar skeleton */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={160} />
              <Skeleton variant="rounded" height={40} />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EntityFormLayout({
  title,
  breadcrumbs,
  loading = false,
  saving = false,
  serverError,
  onSave,
  onCancel,
  children,
  previewPanel,
  sidebar,
  statusSection,
  junctionSection,
}: EntityFormLayoutProps) {
  const rightColumn = previewPanel ?? sidebar;
  const hasRightColumn = Boolean(previewPanel || sidebar);
  // When both previewPanel and sidebar are provided, stack them in the right column.
  const combinedRightColumn =
    previewPanel && sidebar ? (
      <Stack spacing={3}>
        {previewPanel}
        {sidebar}
      </Stack>
    ) : (
      rightColumn
    );

  return (
    <Box>
      {/* ── Breadcrumbs ── */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 1 }}
      >
        {breadcrumbs.map((crumb, index) =>
          crumb.href ? (
            <Link
              key={index}
              href={crumb.href}
              underline="hover"
              color="text.secondary"
              sx={{ fontSize: "0.875rem" }}
            >
              {crumb.label}
            </Link>
          ) : (
            <Typography
              key={index}
              color="text.primary"
              sx={{ fontSize: "0.875rem" }}
            >
              {crumb.label}
            </Typography>
          ),
        )}
      </Breadcrumbs>

      {/* ── Page Title ── */}
      <Typography variant="h4" sx={{ mb: 3 }}>
        {title}
      </Typography>

      {/* ── Server Error Alert ── */}
      {serverError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {serverError}
        </Alert>
      )}

      {/* ── Loading Skeleton ── */}
      {loading ? (
        <FormSkeleton />
      ) : (
        <>
          {/* ── Two-Column Responsive Grid: form fields | media preview ── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: hasRightColumn
                ? { xs: "1fr", md: "2fr 1fr" }
                : "1fr",
              gap: 3,
            }}
          >
            {/* Main Content Card */}
            <Card>
              <CardContent sx={{ p: 3 }}>{children}</CardContent>
            </Card>

            {/* Right column: media preview takes priority over generic sidebar */}
            {hasRightColumn && (
              <Card sx={{ height: "fit-content", position: { md: "sticky" }, top: { md: 24 } }}>
                <CardContent sx={{ p: 3 }}>{combinedRightColumn}</CardContent>
              </Card>
            )}
          </Box>

          {/* ── Status Section (publish/active toggle) — full width, below the grid ── */}
          {statusSection && (
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ p: 3 }}>{statusSection}</CardContent>
            </Card>
          )}

          {/* ── Junction/Relationship Section ── */}
          {junctionSection && (
            <Card
              sx={{
                mt: 3,
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <CardContent sx={{ p: 3 }}>{junctionSection}</CardContent>
            </Card>
          )}

          {/* ── Action Buttons — bottom-right of the form, in normal page flow ── */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ justifyContent: "flex-end", mt: 4 }}
          >
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              onClick={onCancel}
              disabled={saving}
              sx={{ minWidth: 140, minHeight: 48, fontSize: "0.9375rem" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={onSave}
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : undefined
              }
              sx={{ minWidth: 160, minHeight: 48, fontSize: "0.9375rem" }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}
