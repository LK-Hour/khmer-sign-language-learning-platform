import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { kslColors, kslRadii } from "@/theme/theme";

export default function CameraFeedPlaceholder() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 552,
        aspectRatio: "552 / 508",
        borderRadius: `${kslRadii.signImage}px`,
        bgcolor: "grey.200",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        border: 2,
        borderColor: "divider",
        borderStyle: "dashed",
      }}
      aria-label="Camera feed placeholder"
    >
      <VideocamOutlinedIcon sx={{ fontSize: 48, color: kslColors.locked }} />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        AI hand detection coming soon
      </Typography>
    </Box>
  );
}
