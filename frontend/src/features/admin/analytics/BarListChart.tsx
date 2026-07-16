"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";

export interface BarListItem {
  label: string;
  value: number; // percentage 0-100
}

interface BarListChartProps {
  items: BarListItem[];
  /** If true, bar uses error color for low values */
  danger?: boolean;
}

/** Vertical bar-list chart: each row shows a label, percentage, and a colored LinearProgress bar. */
export default function BarListChart({ items, danger = false }: BarListChartProps) {
  const barColor = danger ? "warning" : "success";

  return (
    <Stack spacing={2}>
      {items.map((item) => (
        <Box key={item.label}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {item.value}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(Math.max(item.value, 0), 100)}
            color={barColor}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      ))}
    </Stack>
  );
}
