"use client";

import {
  Box,
  Card,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";

import type { UserResponse } from "../api/userAdminApi";
import StatusChip from "../components/shared/StatusChip";
import Scrollbar from "../components/shared/Scrollbar";

// ── Types ────────────────────────────────────────────────────────────────────

interface UserTableProps {
  users: UserResponse[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick: (user: UserResponse) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

/** Paginated MUI table displaying platform users with Minimals styling. */
export default function UserTable({
  users,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: UserTableProps) {
  if (loading) {
    return (
      <Card>
        <Box sx={{ p: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={48} sx={{ mb: 1 }} />
          ))}
        </Box>
      </Card>
    );
  }

  return (
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
              <TableCell>Display Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Account Type</TableCell>
              <TableCell>Auth Provider</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
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
                  onClick={() => onRowClick(user)}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
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
                    <StatusChip variant={user.is_active ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
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
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Box>
    </Card>
  );
}
