import { Button, Paper, Stack, Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
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
  passed: boolean;
  isSubmitting: boolean;
  isContinuing?: boolean;
  onRetry: () => void;
  onContinue: () => void | Promise<void>;
};

export default function PracticeFeedbackPanel({
  title,
  text,
  continueLabel,
  passed,
  isSubmitting,
  isContinuing = false,
  onRetry,
  onContinue,
}: PracticeFeedbackPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        p: 2,
        borderRadius: `${KslRadii.signImage}px`,
        bgcolor: KslColors.primaryLighter,
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
        <LoadingButton
          variant="contained"
          loading={isContinuing}
          loadingPosition="center"
          onClick={onContinue}
          disabled={!passed || isSubmitting || isContinuing}
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
            "&.MuiLoadingButton-loading": {
              color: "transparent",
            },
          }}
        >
          {isContinuing ? null : continueLabel}
        </LoadingButton>
      </Stack>
    </Paper>
  );
}
