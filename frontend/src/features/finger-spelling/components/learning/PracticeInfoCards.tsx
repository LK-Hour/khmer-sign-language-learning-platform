import { Paper, Typography } from "@mui/material";
import { fontFamilies } from "@/theme/fonts";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

type TipCardProps = {
  label: string;
  text: string;
};

export function TipCard({ label, text }: TipCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 2,
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        bgcolor: KslColors.primaryLighter,
      }}
    >
      <Typography
        sx={{
          color: KslColors.textSecondary,
          fontSize: KslFontSizes.xs,
          fontWeight: 600,
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: KslColors.textPrimary,
          fontSize: "14px",
          lineHeight: 1.55,
        }}
      >
        {text}
      </Typography>
    </Paper>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  highlight?: boolean;
  khmerValue?: boolean;
};

export function MetricCard({
  label,
  value,
  highlight = false,
  khmerValue = false,
}: MetricCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 2,
        border: `1px solid ${highlight ? "rgba(31,159,111,0.28)" : KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        bgcolor: highlight ? KslColors.primaryLight : KslColors.primaryLighter,
      }}
    >
      <Typography
        component="p"
        sx={{
          m: 0,
          color: KslColors.primaryDark,
          fontFamily: khmerValue ? fontFamilies.khmer : fontFamilies.english,
          fontSize: khmerValue
            ? { xs: KslFontSizes["3xl"], md: KslFontSizes["4xl"] }
            : KslFontSizes["2xl"],
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          mt: 0.75,
          color: KslColors.textSecondary,
          fontSize: KslFontSizes.sm,
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>
    </Paper>
  );
}
