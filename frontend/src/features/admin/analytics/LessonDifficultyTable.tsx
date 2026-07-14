"use client";

import { Paper, Typography } from "@mui/material";

import type { LessonDifficultyEntry } from "../api/analyticsAdminApi";

interface LessonDifficultyTableProps {
  entries: LessonDifficultyEntry[];
}

/**
 * Sortable table showing per-lesson difficulty metrics.
 * Highlights lessons with completion rate below 30% as potentially problematic.
 *
 * TODO (task 9.3): Full implementation with sorting and highlighting.
 */
export default function LessonDifficultyTable({ entries }: LessonDifficultyTableProps) {
  if (entries.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography
          sx={{ fontSize: "0.875rem", color: "text.secondary", textAlign: "center" }}
        >
          No lesson difficulty data available.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography
        sx={{ fontSize: "0.875rem", color: "text.secondary", textAlign: "center" }}
      >
        Lesson difficulty table — {entries.length} lessons loaded.
      </Typography>
    </Paper>
  );
}
