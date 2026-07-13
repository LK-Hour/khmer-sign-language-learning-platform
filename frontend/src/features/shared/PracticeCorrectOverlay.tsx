"use client";

import { Box, Stack, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";

type PracticeCorrectOverlayProps = {
  open: boolean;
  title: string;
  subtitle: string;
  targetLabel?: string;
};

export default function PracticeCorrectOverlay({
  open,
  title,
  subtitle,
  targetLabel,
}: PracticeCorrectOverlayProps) {
  return (
    <AnimatePresence>
      {open ? (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: `${KslRadii.signImage}px`,
            overflow: "hidden",
            pointerEvents: "none",
            bgcolor: "rgba(20, 40, 76, 0.42)",
            backdropFilter: "blur(2px)",
          }}
        >
          <Stack
            component={motion.div}
            initial={{ scale: 0.72, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            spacing={1.25}
            sx={{
              alignItems: "center",
              textAlign: "center",
              px: 2.5,
              py: 2.5,
              mx: 2,
              maxWidth: 360,
              borderRadius: `${KslRadii.card + 4}px`,
              bgcolor: KslColors.surface,
              boxShadow: "0 18px 48px rgba(20, 40, 76, 0.28)",
              border: `2px solid ${KslColors.success}`,
            }}
          >
            <Box
              component={motion.div}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.05 }}
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "rgba(31,159,111,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: KslColors.success,
              }}
            >
              <Icon icon="mdi:check-bold" width={34} />
            </Box>

            <Typography
              sx={{
                color: KslColors.success,
                fontFamily: fontFamilies.english,
                fontSize: { xs: KslFontSizes.xl, sm: KslFontSizes["2xl"] },
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              {title}
            </Typography>

            {targetLabel ? (
              <Typography
                sx={{
                  color: KslColors.primaryDark,
                  fontFamily: fontFamilies.khmer,
                  fontSize: { xs: KslFontSizes["2xl"], sm: KslFontSizes["3xl"] },
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                {targetLabel}
              </Typography>
            ) : null}

            <Typography
              sx={{
                color: KslColors.textSecondary,
                fontSize: KslFontSizes.sm,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </Typography>
          </Stack>
        </Box>
      ) : null}
    </AnimatePresence>
  );
}
