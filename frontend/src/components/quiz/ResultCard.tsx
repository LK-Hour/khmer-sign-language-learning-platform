"use client";

import CheckIcon from "@mui/icons-material/Check";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";
import { KslColors, KslFontSizes } from "@/theme/theme";

type ResultCardProps = {
  title: string;
  subtitle: string;
  continueLabel: string;
  retakeLabel?: string;
  onContinue: () => void;
  onRetake?: () => void;
};

export default function ResultCard({
  title,
  subtitle,
  continueLabel,
  retakeLabel,
  onContinue,
  onRetake,
}: ResultCardProps) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        py: 4,
        gap: 3,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontFamily: "var(--font-inter), sans-serif",
          fontWeight: 700,
          fontSize: KslFontSizes.lg,
          color: KslColors.secondary,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontSize: KslFontSizes.md,
          color: KslColors.secondary,
        }}
      >
        {subtitle}
      </Typography>
      <Box
        sx={{
          width: { xs: 200, md: 300 },
          height: { xs: 200, md: 300 },
          borderRadius: "50%",
          bgcolor: KslColors.primaryTrack,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: KslColors.secondary,
        }}
        aria-hidden
      >
        <CheckIcon sx={{ fontSize: 96 }} />
      </Box>
      <PrimaryActionButton label={continueLabel} onClick={onContinue} />
      {retakeLabel && onRetake && (
        <Typography
          component="button"
          variant="h5"
          onClick={onRetake}
          sx={{
            border: "none",
            bgcolor: "transparent",
            cursor: "pointer",
            fontSize: KslFontSizes.lg,
            color: KslColors.primary,
            textDecoration: "underline",
          }}
        >
          {retakeLabel}
        </Typography>
      )}
    </Box>
  );
}
