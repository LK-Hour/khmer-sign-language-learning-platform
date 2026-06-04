import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/material/Box";
import { kslColors } from "@/theme/theme";

type PlayButtonProps = {
  size?: number;
};

export default function PlayButton({ size = 44 }: PlayButtonProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: kslColors.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        flexShrink: 0,
      }}
      aria-hidden
    >
      <PlayArrowIcon sx={{ fontSize: size * 0.45 }} />
    </Box>
  );
}
