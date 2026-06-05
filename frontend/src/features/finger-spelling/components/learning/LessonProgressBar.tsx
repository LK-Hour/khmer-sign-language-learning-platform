import Box from "@mui/material/Box";
import { KslColors, KslRadii } from "@/theme/theme";

type LessonProgressBarProps = {
  value: number;
  max?: number;
};

export default function LessonProgressBar({
  value,
  max = 100,
}: LessonProgressBarProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <Box
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      sx={{
        width: "100%",
        maxWidth: 1105,
        height: 18,
        borderRadius: KslRadii.progress,
        bgcolor: KslColors.primaryTrack,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: `${percent}%`,
          height: "100%",
          bgcolor: KslColors.primary,
          borderRadius: KslRadii.progress,
          transition: "width 0.4s ease",
        }}
      />
    </Box>
  );
}
