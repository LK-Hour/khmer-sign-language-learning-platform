import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { kslColors } from "@/theme/theme";

type BadgeProps = {
  label: string;
};

export default function Badge({ label }: BadgeProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 130,
        height: 32,
        px: 1.5,
        borderRadius: 1,
        bgcolor: kslColors.primary,
        color: "white",
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, lineHeight: 1 }}
      >
        {label}
      </Typography>
    </Box>
  );
}
