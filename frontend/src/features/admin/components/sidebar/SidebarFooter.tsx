"use client";

import Link from "next/link";
import { Box, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTranslation } from "@/i18n/useTranslation";

export default function SidebarFooter() {
  const { t } = useTranslation();

  return (
    <Box sx={{ px: 2.5, py: 2, borderTop: (theme) => `1px dashed ${theme.palette.divider}` }}>
      <Box
        component={Link}
        href="/"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          textDecoration: "none",
          color: "text.secondary",
          borderRadius: 1,
          px: 1,
          py: 0.75,
          "&:hover": { bgcolor: "action.hover", color: "text.primary" },
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {t("ADMIN.BACK_TO_SITE")}
        </Typography>
      </Box>
    </Box>
  );
}
