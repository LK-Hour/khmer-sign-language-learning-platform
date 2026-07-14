"use client";

import {
  Avatar,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { LeaderboardEntry } from "../api/analyticsAdminApi";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

const tableHeaderSx = {
  fontSize: "0.6875rem",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "text.secondary",
} as const;

/** Top 10 learners ranked table. */
export default function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography
          sx={{ fontSize: "0.875rem", color: "text.secondary", textAlign: "center" }}
        >
          No leaderboard data available.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.200" }}>
            <TableCell align="center" sx={{ width: 64, ...tableHeaderSx }}>
              Rank
            </TableCell>
            <TableCell sx={tableHeaderSx}>Learner</TableCell>
            <TableCell align="center" sx={tableHeaderSx}>
              Completed
            </TableCell>
            <TableCell sx={tableHeaderSx}>Last Active</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.user_id} hover>
              <TableCell align="center">
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    color: "text.primary",
                  }}
                >
                  #{entry.rank}
                </Typography>
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Avatar
                    src={entry.avatar_url ?? undefined}
                    alt={entry.display_name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {entry.display_name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography
                    sx={{ fontSize: "0.875rem", fontWeight: 600, color: "text.primary" }}
                  >
                    {entry.display_name}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 700 }}>
                  {entry.total_completed}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                  {entry.last_active_at
                    ? new Date(entry.last_active_at).toLocaleDateString()
                    : "—"}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
