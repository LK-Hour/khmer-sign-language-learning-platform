"use client";

import Search from "@mui/icons-material/Search";
import {
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  type SelectChangeEvent,
} from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserFilterValues {
  q: string;
  account_type: string; // "all" | "student" | "admin" | "guest"
  is_active: string; // "all" | "true" | "false"
}

interface UserFiltersProps {
  filters: UserFilterValues;
  onFilterChange: (filters: UserFilterValues) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

/** Search + role + status filters for the user management page. */
export default function UserFilters({ filters, onFilterChange }: UserFiltersProps) {
  const { t } = useTranslation();

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, q: value });
  };

  const handleRoleChange = (e: SelectChangeEvent) => {
    onFilterChange({ ...filters, account_type: e.target.value });
  };

  const handleStatusChange = (e: SelectChangeEvent) => {
    onFilterChange({ ...filters, is_active: e.target.value });
  };

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      sx={{ mb: 2, alignItems: { md: "center" } }}
    >
      <TextField
        size="small"
        value={filters.q}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder={t("ADMIN.SEARCH_PLACEHOLDER")}
        sx={{ minWidth: { md: 280 }, bgcolor: "background.paper" }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Role</InputLabel>
        <Select
          value={filters.account_type}
          label="Role"
          onChange={handleRoleChange}
        >
          <MenuItem value="all">All Roles</MenuItem>
          <MenuItem value="student">Student</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="guest">Guest</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={filters.is_active}
          label="Status"
          onChange={handleStatusChange}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
