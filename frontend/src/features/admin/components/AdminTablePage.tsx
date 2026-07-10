"use client";

import Search from "@mui/icons-material/Search";
import {
  InputAdornment,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

import { useTranslation } from "@/i18n/useTranslation";

import { AdminColors, AdminFontSizes } from "./adminTokens";

/** Page header row: breadcrumb-ish eyebrow, title with icon, primary CTA. */
export function AdminPageHeader({
  eyebrow,
  title,
  icon,
  action,
}: {
  eyebrow?: string;
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Paper
      square
      elevation={0}
      sx={{ zIndex: 1, p: 2, borderBottom: `1px solid ${AdminColors.border}` }}
    >
      <Stack spacing={1}>
        {eyebrow && (
          <Typography
            sx={{
              fontSize: AdminFontSizes.small,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: AdminColors.sidebarMuted,
            }}
          >
            {eyebrow}
          </Typography>
        )}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {icon}
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 700, color: AdminColors.heading }}
            >
              {title}
            </Typography>
          </Stack>
          {action}
        </Stack>
      </Stack>
    </Paper>
  );
}

/** Filter/search row above the table. Extra filters are passed as children. */
export function AdminFilterBar({
  search,
  onSearchChange,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      sx={{ mb: 2, alignItems: { md: "center" } }}
    >
      <TextField
        size="small"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t("ADMIN.SEARCH_PLACEHOLDER")}
        sx={{ minWidth: { md: 280 }, bgcolor: "background.paper" }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: AdminColors.muted }} />
              </InputAdornment>
            ),
          },
        }}
      />
      {children}
    </Stack>
  );
}

/** Table footer: record count + pagination, like the reference dashboard. */
export function AdminTableFooter({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}) {
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[10, 25, 50]}
      onPageChange={(_, newPage) => onPageChange(newPage)}
      onRowsPerPageChange={(e) => onRowsPerPageChange(Number(e.target.value))}
      sx={{ borderTop: `1px solid ${AdminColors.softBorder}` }}
    />
  );
}

/** Empty-table placeholder row content. */
export function AdminEmptyState({ message }: { message: string }) {
  return (
    <Stack sx={{ py: 6, alignItems: "center" }}>
      <Typography sx={{ fontSize: AdminFontSizes.body, color: AdminColors }}>
        {message}
      </Typography>
    </Stack>
  );
}
