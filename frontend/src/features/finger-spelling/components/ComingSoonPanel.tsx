import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type ComingSoonPanelProps = {
  title: string;
  description: string;
};

export default function ComingSoonPanel({
  title,
  description,
}: ComingSoonPanelProps) {
  return (
    <Box
      sx={{
        py: 6,
        px: 2,
        textAlign: "center",
        bgcolor: "background.paper",
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
}
