"use client";

import { Box, Typography } from "@mui/material";

export default function QuizWordDetectionPage() {
  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography color="text.secondary">
        Select a unit from the sidebar to view its quiz exercises.
      </Typography>
    </Box>
  );
}
