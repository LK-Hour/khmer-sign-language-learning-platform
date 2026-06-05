import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import BackButton from "@/components/ui/BackButton";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

type QuizHeaderProps = {
  percent: number;
  points: number;
  backHref?: string;
};

export default function QuizHeader({
  percent,
  points,
  backHref,
}: QuizHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        mb: 4,
        maxWidth: 1321,
        mx: "auto",
        width: "100%",
      }}
    >
      <BackButton href={backHref} />
      <Box
        sx={{
          flex: 1,
          height: 18,
          borderRadius: KslRadii.progress,
          bgcolor: KslColors.primaryTrack,
          overflow: "hidden",
        }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <Box
          sx={{
            width: `${percent}%`,
            height: "100%",
            bgcolor: KslColors.primary,
            borderRadius: KslRadii.progress,
            transition: "width 0.3s ease",
          }}
        />
      </Box>
      <Typography
        variant="h5"
        sx={{
          fontFamily: "var(--font-inter), sans-serif",
          fontWeight: 700,
          fontSize: KslFontSizes.lg,
          color: KslColors.secondary,
          minWidth: 80,
          textAlign: "right",
        }}
      >
        {points} pts
      </Typography>
    </Box>
  );
}
