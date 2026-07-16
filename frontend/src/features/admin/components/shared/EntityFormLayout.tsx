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
  sidebar?: ReactNode; // Sidebar content (order_index, status, metadata)
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
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
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
  sidebar,
  junctionSection,
}: EntityFormLayoutProps) {
  return (
    <Box sx={{ pb: 10 }}>
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
          {/* ── Two-Column Responsive Grid ── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: sidebar
                ? { xs: "1fr", md: "2fr 1fr" }
                : "1fr",
              gap: 3,
            }}
          >
            {/* Main Content Card */}
            <Card>
              <CardContent sx={{ p: 3 }}>{children}</CardContent>
            </Card>

            {/* Optional Sidebar Card */}
            {sidebar && (
              <Card sx={{ height: "fit-content" }}>
                <CardContent sx={{ p: 3 }}>{sidebar}</CardContent>
              </Card>
            )}
          </Box>

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
        </>
      )}

      {/* ── Sticky Bottom Action Buttons ── */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar - 1,
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
          px: 3,
          py: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "flex-end", maxWidth: 1200, mx: "auto" }}
        >
          <Button
            variant="text"
            color="inherit"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onSave}
            disabled={saving || loading}
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : undefined
            }
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
