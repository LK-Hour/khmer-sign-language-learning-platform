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
  retryLabel: string;
  continueLabel: string;
  passed: boolean;
  isSubmitting: boolean;
  onRetry: () => void;
  onContinue: () => void | Promise<void>;
};

export default function PracticeFeedbackPanel({
  title,
  text,
  retryLabel,
  continueLabel,
  passed,
  isSubmitting,
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
        <Button
          variant="outlined"
          onClick={onRetry}
          disabled={isSubmitting}
          sx={{
            minWidth: 110,
            minHeight: 46,
            borderRadius: `${KslRadii.button}px`,
            fontSize: KslFontSizes.md,
            fontWeight: 700,
          }}
        >
          {retryLabel}
        </Button>
        <Button
          variant="contained"
          onClick={onContinue}
          disabled={!passed || isSubmitting}
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
          }}
        >
          {continueLabel}
        </Button>
      </Stack>
    </Paper>
  );
}
