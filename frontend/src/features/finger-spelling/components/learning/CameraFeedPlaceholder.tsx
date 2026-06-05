import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { KslColors, KslRadii } from "@/theme/theme";

export default function CameraFeedPlaceholder() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 552,
        aspectRatio: "552 / 508",
        borderRadius: `${KslRadii.signImage}px`,
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
      <VideocamOutlinedIcon sx={{ fontSize: 48, color: KslColors.locked }} />
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        AI hand detection coming soon
      </Typography>
    </Box>
  );
}
