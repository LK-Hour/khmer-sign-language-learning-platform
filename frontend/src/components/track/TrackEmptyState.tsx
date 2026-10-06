"use client";

import { Icon } from "@iconify/react";
import { Button, Paper, Stack, Typography } from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

/** Shown when search/filters hide every unit on a track page. */
export default function TrackEmptyState({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation();

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px dashed ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        px: 3,
        py: 6,
        textAlign: "center",
      }}
    >
      <Stack spacing={1} sx={{ alignItems: "center" }}>
        <Icon icon="solar:magnifer-linear" width={36} color={KslColors.textSecondary} />
        <Typography sx={{ color: KslColors.textPrimary, fontSize: KslFontSizes.lg, fontWeight: 700 }}>
          {t("TRACK_FILTER.NO_RESULTS")}
        </Typography>
        <Typography sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.sm }}>
          {t("TRACK_FILTER.NO_RESULTS_HINT")}
        </Typography>
        <Button onClick={onClear} sx={{ mt: 1, fontWeight: 700 }}>
          {t("TRACK_FILTER.CLEAR")}
        </Button>
      </Stack>
    </Paper>
  );
}
