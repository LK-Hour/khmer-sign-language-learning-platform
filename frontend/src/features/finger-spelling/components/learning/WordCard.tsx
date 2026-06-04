import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { kslColors, kslRadii, kslShadows } from "@/theme/theme";

type WordCardProps = {
  letter: string;
  romanization?: string;
  /** Pronunciation note — only on lesson intro step. */
  showRomanization?: boolean;
};

export default function WordCard({
  letter,
  romanization,
  showRomanization = false,
}: WordCardProps) {
  return (
    <Box
      sx={{
        border: `4px solid ${kslColors.primaryTrack}`,
        borderRadius: `${kslRadii.wordCard}px`,
        boxShadow: kslShadows.button,
        px: { xs: 4, md: 8 },
        py: 1,
        textAlign: "center",
        bgcolor: "background.paper",
        maxWidth: 418,
        width: "100%",
      }}
    >
      <Typography variant="h3" component="p">
        {letter}
      </Typography>
      {showRomanization && romanization && (
        <Typography
          variant="h5"
          component="p"
          sx={{ opacity: 0.5, mt: -0.5 }}
        >
          {romanization}
        </Typography>
      )}
    </Box>
  );
}
