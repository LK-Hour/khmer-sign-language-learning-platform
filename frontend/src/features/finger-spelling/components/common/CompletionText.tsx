import Typography from "@mui/material/Typography";
import { KslColors } from "@/theme/theme";

type CompletionTextProps = {
  completed: number;
  total: number;
  suffix?: string;
};

export default function CompletionText({
  completed,
  total,
  suffix = "lessons completed",
}: CompletionTextProps) {
  return (
    <Typography
      variant="body2"
      sx={{
        fontFamily: "var(--font-inter), sans-serif",
        color: KslColors.textSecondary,
      }}
    >
      {completed}/{total} {suffix}
    </Typography>
  );
}
