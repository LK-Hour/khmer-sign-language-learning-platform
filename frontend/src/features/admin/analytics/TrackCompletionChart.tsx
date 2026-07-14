"use client";

import { Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";

import type { TrackCompletionStats } from "../api/analyticsAdminApi";

interface TrackCompletionChartProps {
  data: TrackCompletionStats[];
}

const TRACK_LABELS: Record<string, string> = {
  finger: "Finger Spelling",
  word_detection: "Word Detection",
};

/** Bar chart showing per-track completion rates with raw counts. */
export default function TrackCompletionChart({ data }: TrackCompletionChartProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        {data.map((track) => (
          <Box key={track.track}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", mb: 1 }}
            >
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "text.primary",
                }}
              >
                {TRACK_LABELS[track.track] ?? track.track}
              </Typography>
              <Typography
                sx={{ fontSize: "0.75rem", color: "text.secondary" }}
              >
                {track.completed_lessons}/{track.total_lessons} lessons completed (
                {track.completion_rate.toFixed(1)}%)
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(track.completion_rate, 100)}
              sx={{
                height: 12,
                borderRadius: 6,
                bgcolor: "grey.200",
                "& .MuiLinearProgress-bar": {
                  bgcolor: "primary.main",
                  borderRadius: 6,
                },
              }}
            />
          </Box>
        ))}
        {data.length === 0 && (
          <Typography
            sx={{ fontSize: "0.875rem", color: "text.secondary", textAlign: "center" }}
          >
            No track completion data available.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
