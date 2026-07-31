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
        minHeight: { xs: 320, md: 480 },
        py: { xs: 3.5, md: 7 },
        px: { xs: 1.5, md: 2 },
        overflow: "hidden",
        borderRadius: { xs: `${KslRadii.card}px`, md: `${KslRadii.card + 8}px` },
        background:
          "radial-gradient(circle at 50% 28%, rgba(31,159,111,0.14) 0%, rgba(242,251,247,0.95) 42%, #ffffff 78%)",
        border: `1px solid ${KslColors.border}`,
      }}
    >
      {BURST_COLORS.map((color, index) => {
        const angle = (index / BURST_COLORS.length) * Math.PI * 2;
        const distance = 78 + (index % 3) * 22;
        return (
          <Box
            key={`${color}-${index}`}
            component={motion.div}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0.85, 0],
              scale: [0.2, 1, 1.1, 0.6],
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance - 28,
            }}
            transition={{
              duration: 1.6,
              delay: 0.15 + index * 0.05,
              ease: "easeOut",
            }}
            sx={{
              position: "absolute",
              top: "36%",
              left: "50%",
              width: { xs: 8 + (index % 3) * 3, md: 12 + (index % 3) * 4 },
              height: { xs: 8 + (index % 3) * 3, md: 12 + (index % 3) * 4 },
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
          width: { xs: 84, md: 112 },
          height: { xs: 84, md: 112 },
          mb: { xs: 2, md: 3 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component={motion.div}
          animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.12, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          sx={{
            position: "absolute",
            inset: { xs: -4, md: -8 },
            borderRadius: "50%",
            bgcolor: "rgba(31,159,111,0.14)",
          }}
        />
        <Box
          sx={{
            width: { xs: 64, md: 88 },
            height: { xs: 64, md: 88 },
            borderRadius: "50%",
            bgcolor: KslColors.success,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: {
              xs: "0 6px 16px rgba(31,159,111,0.22)",
              md: "0 10px 28px rgba(31,159,111,0.28)",
            },
          }}
        >
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              fontSize: { xs: 30, md: 44 },
              lineHeight: 0,
            }}
          >
            <Icon icon="mdi:trophy-variant" width="1em" height="1em" />
          </Box>
        </Box>
      </Box>

      <Typography
        component={motion.div}
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        role="heading"
        aria-level={2}
        sx={{
          m: 0,
          color: KslColors.primaryDark,
          fontFamily: fontFamilies.english,
          fontSize: { xs: 26, md: 42 },
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
          mt: { xs: 1, md: 1.5 },
          mb: 0,
          maxWidth: 420,
          color: KslColors.textSecondary,
          fontSize: { xs: KslFontSizes.sm, md: KslFontSizes.lg },
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
          spacing={0.35}
          sx={{
            mt: { xs: 2, md: 3 },
            px: { xs: 2.25, md: 3 },
            py: { xs: 1.25, md: 1.75 },
            borderRadius: `${KslRadii.card}px`,
            bgcolor: KslColors.primaryLighter,
            border: `1px solid rgba(31,159,111,0.22)`,
            alignItems: "center",
            minWidth: { xs: 132, md: 160 },
          }}
        >
          <Typography
            sx={{
              color: KslColors.primaryDark,
              fontSize: { xs: 28, md: 42 },
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
          mt: { xs: 2.5, md: 4 },
          fontWeight: 800,
          minHeight: { xs: 44, md: 52 },
          px: { xs: 3.5, md: 4.5 },
          borderRadius: `${KslRadii.button}px`,
          fontSize: { xs: KslFontSizes.sm, md: KslFontSizes.md },
          boxShadow: { xs: "0 4px 12px rgba(20,40,76,0.12)", md: KslShadows.card },
          bgcolor: KslColors.primary,
          "&:hover": { bgcolor: KslColors.primaryDark },
        }}
      >
        {actionLabel}
      </Button>
    </Stack>
  );
}
