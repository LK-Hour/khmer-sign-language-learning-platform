import { Button, Paper, Stack, Typography } from "@mui/material";
import {
  KslColors,
  KslFontSizes,
  KslRadii,
  KslShadows,
} from "@/theme/theme";

type PracticeFeedbackPanelProps = {
  title: string;
  text: string;
  continueLabel: string;
  retryLabel: string;
  passed: boolean;
  showRetry?: boolean;
  isSubmitting: boolean;
  isContinuing?: boolean;
  onRetry: () => void;
  onContinue: () => void | Promise<void>;
};

export default function PracticeFeedbackPanel({
  title,
  text,
  continueLabel,
  retryLabel,
  passed,
  showRetry = false,
  isSubmitting,
  isContinuing = false,
  onRetry,
  onContinue,
}: PracticeFeedbackPanelProps) {
  const isRetryDisabled = Boolean(isSubmitting || isContinuing);
  const isContinueLoading = Boolean(isContinuing);
  const isContinueDisabled = Boolean(!passed || isSubmitting || isContinuing);

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${KslColors.border}`,
        bgcolor: KslColors.primaryLighter,
        borderRadius: `${KslRadii.card}px`,
        p: 2,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Stack spacing={0.5} sx={{ flex: 1 }}>
        <Typography
          component="h4"
          sx={{
            m: 0,
            fontSize: KslFontSizes.lg,
            fontWeight: 600,
            color: KslColors.textPrimary,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            color: KslColors.textSecondary,
            fontSize: KslFontSizes.sm,
            lineHeight: 1.55,
          }}
        >
          {text}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {showRetry ? (
          <Button
            variant="outlined"
            color="inherit"
            onClick={onRetry}
            disabled={isRetryDisabled}
            sx={{
              minWidth: 120,
              minHeight: 46,
              borderRadius: `${KslRadii.button}px`,
              fontSize: KslFontSizes.md,
              fontWeight: 700,
            }}
          >
            {retryLabel}
          </Button>
        ) : null}
        <Button
          variant="contained"
          loading={isContinueLoading}
          loadingPosition="center"
          onClick={onContinue}
          disabled={isContinueDisabled}
          sx={{
            minWidth: 150,
            minHeight: 46,
            borderRadius: `${KslRadii.button}px`,
            fontSize: KslFontSizes.md,
            fontWeight: 700,
            boxShadow: passed ? KslShadows.card : "none",
            bgcolor: passed ? KslColors.primary : KslColors.disabled,
            "&:hover": {
              bgcolor: passed ? KslColors.primaryDark : KslColors.disabled,
            },
            "&.MuiButton-loading": {
              color: "transparent",
            },
          }}
        >
          {isContinuing ? null : continueLabel}
        </Button>
      </Stack>
    </Paper>
  );
}
