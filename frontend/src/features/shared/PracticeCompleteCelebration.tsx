"use client";

import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";

const BURST_COLORS = ["#1f9f6f", "#f3b83f", "#137FEC", "#dff7ed", "#FFD166", "#7BD389"];

type PracticeCompleteCelebrationProps = {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  isSaving?: boolean;
  avgScore?: number | null;
  scoreLabel?: string;
};

export default function PracticeCompleteCelebration({
  title,
  subtitle,
  actionLabel,
  onAction,
  isSaving = false,
  avgScore = null,
  scoreLabel,
}: PracticeCompleteCelebrationProps) {
  if (isSaving) {
    return (
      <Stack
        sx={{
          alignItems: "center",
          justifyContent: "center",
          minHeight: 360,
          py: 8,
        }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      spacing={0}
      sx={{
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        minHeight: { xs: 420, md: 520 },
        py: { xs: 6, md: 8 },
        px: 2,
        overflow: "hidden",
        borderRadius: `${KslRadii.card + 8}px`,
        background:
          "radial-gradient(circle at 50% 28%, rgba(31,159,111,0.18) 0%, rgba(242,251,247,0.95) 42%, #ffffff 78%)",
        border: `1px solid ${KslColors.border}`,
      }}
    >
      {BURST_COLORS.map((color, index) => {
        const angle = (index / BURST_COLORS.length) * Math.PI * 2;
        const distance = 110 + (index % 3) * 28;
        return (
          <Box
            key={`${color}-${index}`}
            component={motion.div}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0.85, 0],
              scale: [0.2, 1, 1.1, 0.6],
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance - 40,
            }}
            transition={{
              duration: 1.6,
              delay: 0.15 + index * 0.05,
              ease: "easeOut",
            }}
            sx={{
              position: "absolute",
              top: "38%",
              left: "50%",
              width: 12 + (index % 3) * 4,
              height: 12 + (index % 3) * 4,
              borderRadius: index % 2 === 0 ? "50%" : 2,
              bgcolor: color,
              pointerEvents: "none",
            }}
          />
        );
      })}

      <Box
        component={motion.div}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.12, 1], opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        sx={{
          position: "relative",
          width: 120,
          height: 120,
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component={motion.div}
          animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.15, 0.45] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          sx={{
            position: "absolute",
            inset: -10,
            borderRadius: "50%",
            bgcolor: "rgba(31,159,111,0.18)",
          }}
        />
        <Box
          sx={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            bgcolor: KslColors.success,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 16px 40px rgba(31,159,111,0.35)",
          }}
        >
          <Icon icon="mdi:trophy-variant" width={48} />
        </Box>
      </Box>

      <Typography
        component={motion.h2}
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        sx={{
          m: 0,
          color: KslColors.primaryDark,
          fontFamily: fontFamilies.english,
          fontSize: { xs: 32, md: 44 },
          fontWeight: 800,
          letterSpacing: "-0.04em",
          textAlign: "center",
          lineHeight: 1.05,
        }}
      >
        {title}
      </Typography>

      <Typography
        component={motion.p}
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.32, duration: 0.4 }}
        sx={{
          mt: 1.5,
          mb: 0,
          maxWidth: 420,
          color: KslColors.textSecondary,
          fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </Typography>

      {avgScore != null ? (
        <Stack
          component={motion.div}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.42, duration: 0.35 }}
          spacing={0.5}
          sx={{
            mt: 3,
            px: 3,
            py: 1.75,
            borderRadius: `${KslRadii.card}px`,
            bgcolor: KslColors.primaryLighter,
            border: `1px solid rgba(31,159,111,0.28)`,
            alignItems: "center",
            minWidth: 160,
          }}
        >
          <Typography
            sx={{
              color: KslColors.primaryDark,
              fontSize: { xs: 36, md: 42 },
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {Math.round(avgScore)}%
          </Typography>
          <Typography
            sx={{
              color: KslColors.textSecondary,
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
            }}
          >
            {scoreLabel}
          </Typography>
        </Stack>
      ) : null}

      <Button
        component={motion.button}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.35 }}
        variant="contained"
        onClick={onAction}
        sx={{
          mt: 4,
          fontWeight: 800,
          minHeight: 52,
          px: 4.5,
          borderRadius: `${KslRadii.button}px`,
          fontSize: KslFontSizes.md,
          boxShadow: KslShadows.card,
          bgcolor: KslColors.primary,
          "&:hover": { bgcolor: KslColors.primaryDark },
        }}
      >
        {actionLabel}
      </Button>
    </Stack>
  );
}
