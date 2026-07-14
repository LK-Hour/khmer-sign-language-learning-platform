"use client";

import Delete from "@mui/icons-material/Delete";
import MoreVert from "@mui/icons-material/MoreVert";
import PersonOff from "@mui/icons-material/PersonOff";
import Refresh from "@mui/icons-material/Refresh";
import Search from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/store/auth.store";

import {
  listUsers,
  type ListUsersParams,
  type UserResponse,
} from "../api/userAdminApi";
import PageHeader from "../components/shared/PageHeader";
import Scrollbar from "../components/shared/Scrollbar";
import StatusChip from "../components/shared/StatusChip";

import UserDetailPanel from "./UserDetailPanel";

// ── Exported helper functions ────────────────────────────────────────────────

/**
 * Filter users by role.
 * Returns only users whose account_type matches the given role.
 */
export function filterUsersByRole(
  users: UserResponse[],
  role: "admin" | "student"
): UserResponse[] {
  return users.filter((user) => user.account_type === role);
}

/**
 * Filter users by search query (case-insensitive substring match on name or email).
 * Returns all users if query is empty.
 */
export function filterUsersBySearch(
  users: UserResponse[],
  query: string
): UserResponse[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return users;
  return users.filter(
    (user) =>
      user.display_name.toLowerCase().includes(trimmed) ||
      (user.email?.toLowerCase().includes(trimmed) ?? false)
  );
}

/**
 * Returns true if destructive actions (delete, deactivate) should be disabled for a user.
 * Destructive actions are disabled for users with the "admin" role.
 */
export function isDestructiveActionDisabled(user: UserResponse): boolean {
  return user.account_type === "admin";
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminUserManagerProps {
  /** Optional role filter to restrict displayed users to a specific role */
  roleFilter?: "admin" | "student";
}

type StatusFilter = "all" | "active" | "inactive";

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Admin User Management page orchestrator.
 *
 * Manages pagination state, filter state, loading/error handling,
 * and displays a user table with search, status filter, and action menus.
 * Accepts a roleFilter prop to show only users of a specific role.
 */
export default function AdminUserManager({ roleFilter }: AdminUserManagerProps) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const currentUser = useAuthStore((s) => s.user);

  // ── Pagination state ─────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // ── Data state ───────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Detail panel state ───────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Action menu state ────────────────────────────────────────────────────
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<UserResponse | null>(null);

  // ── Fetch users ──────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: ListUsersParams = {
        skip: page * pageSize,
        limit: pageSize,
      };

      // Apply role filter at API level when possible
      if (roleFilter) {
        params.account_type = roleFilter;
      }

      // Apply search at API level
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }

      // Apply status filter at API level
      if (statusFilter === "active") {
        params.is_active = true;
      } else if (statusFilter === "inactive") {
        params.is_active = false;
      }

      const data = await listUsers(params);
      setUsers(data);
      setTotalCount(
        data.length < pageSize
          ? page * pageSize + data.length
          : (page + 1) * pageSize + 1
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, roleFilter, searchQuery, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Client-side filtering (for additional safety) ────────────────────────
  const filteredUsers = useMemo(() => {
    let result = users;

    // Apply role filter client-side as well (in case API doesn't filter)
    if (roleFilter) {
      result = filterUsersByRole(result, roleFilter);
    }

    // Apply search filter client-side
    if (searchQuery.trim()) {
      result = filterUsersBySearch(result, searchQuery);
    }

    // Apply status filter client-side
    if (statusFilter === "active") {
      result = result.filter((u) => u.is_active);
    } else if (statusFilter === "inactive") {
      result = result.filter((u) => !u.is_active);
    }

    return result;
  }, [users, roleFilter, searchQuery, statusFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleStatusFilterChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value as StatusFilter);
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
  };

  const handleRowClick = (user: UserResponse) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    user: UserResponse
  ) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuUser(null);
  };

  // ── Derive page title ────────────────────────────────────────────────────
  const pageTitle = roleFilter
    ? `${roleFilter === "admin" ? "Admin" : "Student"} Users`
    : "User Management";

  const pageSubtitle = roleFilter
    ? `Manage ${roleFilter} users and their permissions`
    : "Manage platform users and their permissions";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Stack spacing={2}>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        action={
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      {/* Search and Status Filters */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ alignItems: { md: "center" } }}
      >
        <TextField
          size="small"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name or email..."
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
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Error state */}
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchUsers}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Table */}
      {loading ? (
        <Card>
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={48} sx={{ mb: 1 }} />
            ))}
          </Box>
        </Card>
      ) : (
        <Card>
          <TableContainer component={Scrollbar}>
            <Table sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow
                  sx={{
                    "& .MuiTableCell-head": {
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "text.secondary",
                      backgroundColor: "#F4F6F8",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{
                        cursor: "pointer",
                        "& .MuiTableCell-body": {
                          fontSize: "0.875rem",
                          borderBottomStyle: "dashed",
                        },
                        "&:hover": {
                          bgcolor: "rgba(145, 158, 171, 0.08)",
                        },
                      }}
                      onClick={() => handleRowClick(user)}
                    >
                      <TableCell>
                        <Typography
                          sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                        >
                          {user.display_name}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email ?? "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.account_type}
                          size="small"
                          sx={{
                            textTransform: "capitalize",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            borderRadius: "6px",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {user.auth_provider}
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          variant={user.is_active ? "active" : "inactive"}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        {isDestructiveActionDisabled(user) ? (
                          <Tooltip title="Actions disabled for admin users">
                            <span>
                              <IconButton size="small" disabled>
                                <MoreVert fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, user)}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ borderTop: (t) => `1px dashed ${t.palette.divider}` }}>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              rowsPerPage={pageSize}
              onPageChange={(_, newPage) => handlePageChange(newPage)}
              onRowsPerPageChange={(e) =>
                handlePageSizeChange(parseInt(e.target.value, 10))
              }
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </Card>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={handleMenuClose}
          disabled={menuUser ? isDestructiveActionDisabled(menuUser) : false}
        >
          <ListItemIcon>
            <PersonOff fontSize="small" />
          </ListItemIcon>
          <ListItemText>Deactivate</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleMenuClose}
          disabled={menuUser ? isDestructiveActionDisabled(menuUser) : false}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Detail panel */}
      <UserDetailPanel
        user={selectedUser}
        open={detailOpen}
        onClose={handleDetailClose}
        currentAdminId={currentUser?.id ?? null}
      />
    </Stack>
  );
}
