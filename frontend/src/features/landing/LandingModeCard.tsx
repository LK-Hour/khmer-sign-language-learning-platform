import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { KslColors, KslFontSizes, KslLineHeights, KslRadii } from "@/theme/theme";

type LandingModeCardProps = {
  href: string;
  modeLabel: string;
  title: string;
  description: string;
  stat: string;
};

export default function LandingModeCard({
  href,
  modeLabel,
  title,
  description,
  stat,
}: LandingModeCardProps) {
  return (
    <Card
      component={Link}
      href={href}
      sx={{
        display: "block",
        height: "100%",
        p: { xs: 2.5, md: 3 },
        borderRadius: `${KslRadii.card}px`,
        border: `1px solid ${KslColors.border}`,
        boxShadow: "none",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.15s, box-shadow 0.15s",
        "&:hover": {
          borderColor: KslColors.primary,
          boxShadow: "0 4px 20px rgba(31, 159, 111, 0.12)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: KslColors.primary,
          }}
        >
          {modeLabel}
        </Typography>

        <Typography
          sx={{
            flexShrink: 0,
            fontSize: KslFontSizes.sm,
            fontWeight: 700,
            color: KslColors.primary,
            textAlign: "right",
          }}
        >
          {stat}
        </Typography>
      </Box>

      <Typography
        component="h3"
        sx={{
          mt: 1.5,
          fontWeight: 700,
          fontSize: { xs: 24, md: 32 },
          lineHeight: 1.3,
          color: KslColors.textPrimary,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 1,
          fontSize: KslFontSizes.sm,
          lineHeight: KslLineHeights.sm,
          color: KslColors.textSecondary,
        }}
      >
        {description}
      </Typography>
    </Card>
  );
}
