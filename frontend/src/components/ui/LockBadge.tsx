import LockIcon from "@mui/icons-material/Lock";
import Box from "@mui/material/Box";
import { kslColors } from "@/theme/theme";

type LockBadgeProps = {
  size?: number;
};

export default function LockBadge({ size = 44 }: LockBadgeProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: kslColors.locked,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        flexShrink: 0,
        opacity: 0.85,
      }}
      aria-label="Locked"
    >
      <LockIcon sx={{ fontSize: size * 0.45 }} />
    </Box>
  );
}
