"use client";

import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export interface ScrollbarProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export default function Scrollbar({ children, sx, ...props }: ScrollbarProps & Record<string, unknown>) {
  return (
    <Box
      component={SimpleBar}
      sx={{
        "& .simplebar-scrollbar::before": { bgcolor: "grey.400" },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
