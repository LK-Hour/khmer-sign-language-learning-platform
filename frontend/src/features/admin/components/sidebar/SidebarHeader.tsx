"use client";

import { Box, Stack, Typography } from "@mui/material";
import Image from "next/image";

export default function SidebarHeader() {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", px: 2.5, py: 2 }}>
      {/* Logo */}
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          position: "relative",
        }}
      >
        <Image
          src="/assets/logo.png"
          alt="KSL Logo"
          fill
          style={{ objectFit: "contain" }}
          priority
        />
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
        KSL Admin
      </Typography>
    </Stack>
  );
}
