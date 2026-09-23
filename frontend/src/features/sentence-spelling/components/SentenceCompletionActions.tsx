"use client";

import { Button, Paper } from "@mui/material";
import Link from "next/link";

import Iconify from "@/components/iconify";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslRadii, KslShadows } from "@/theme/theme";

type SentenceCompletionActionsProps = {
  onRestart: () => void;
  /** Where "Back" goes when there is no next sentence to offer. */
  backHref: string;
  /** The sentence to continue with; `null` for custom or last-in-list sentences. */
  next: { href: string; label: string } | null;
};

// Corner size of both buttons. Keep the "px" — a bare number in `sx.borderRadius`
// is multiplied by the theme's `shape.borderRadius` (16), so `8` would render as 128px.
const BUTTON_RADIUS = `${KslRadii.button}px`;

export default function SentenceCompletionActions({
  onRestart,
  backHref,
  next,
}: SentenceCompletionActionsProps) {
  const { t } = useTranslation();

  return (
    <Paper
      elevation={0}
      sx={{
        alignItems: { xs: "stretch", sm: "center" },
        bgcolor: KslColors.primaryLighter,
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        justifyContent: "space-between",
        p: 2,
      }}
    >
      <Button
        variant="outlined"
        onClick={onRestart}
        startIcon={<Iconify icon="solar:restart-bold" sx={{ width: 18, height: 18 }} />}
        sx={{
          borderColor: KslColors.primary,
          borderRadius: BUTTON_RADIUS,
          color: KslColors.primary,
          fontWeight: 700,
          px: 3,
          py: 1,
        }}
      >
        {t("SENTENCE_SPELLING.PRACTICE.RESTART")}
      </Button>

      {next ? (
        <Button
          component={Link}
          href={next.href}
          variant="contained"
          title={next.label}
          aria-label={`${t("SENTENCE_SPELLING.PRACTICE.NEXT_SENTENCE")}: ${next.label}`}
          endIcon={<Iconify icon="solar:arrow-right-linear" sx={{ width: 18, height: 18 }} />}
          sx={{
            borderRadius: BUTTON_RADIUS,
            boxShadow: KslShadows.button,
            fontWeight: 700,
            px: 3,
            py: 1,
          }}
        >
          {t("SENTENCE_SPELLING.PRACTICE.NEXT_SENTENCE")}
        </Button>
      ) : (
        <Button
          component={Link}
          href={backHref}
          variant="outlined"
          startIcon={<Iconify icon="akar-icons:arrow-back-thick-fill" sx={{ width: 16, height: 16 }} />}
          sx={{
            borderColor: KslColors.border,
            borderRadius: BUTTON_RADIUS,
            color: KslColors.primaryDark,
            fontWeight: 700,
            px: 3,
            py: 1,
          }}
        >
          {t("SENTENCE_SPELLING.BACK")}
        </Button>
      )}
    </Paper>
  );
}
