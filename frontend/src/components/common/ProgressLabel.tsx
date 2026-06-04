import Typography from "@mui/material/Typography";
import { kslColors } from "@/theme/theme";

type ProgressLabelProps = {
  completed: number;
  total: number;
  suffix?: string;
};

export default function ProgressLabel({
  completed,
  total,
  suffix = "lessons completed",
}: ProgressLabelProps) {
  return (
    <Typography
      variant="body2"
      sx={{
        fontFamily: "var(--font-inter), sans-serif",
        color: kslColors.textSecondary,
      }}
    >
      {completed}/{total} {suffix}
    </Typography>
  );
}
