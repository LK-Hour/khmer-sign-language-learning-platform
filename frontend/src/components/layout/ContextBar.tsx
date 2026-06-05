import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";

type ContextBarProps = {
  badgeLabel: string;
  title: string;
  subtitle?: string;
  mascotSrc?: string;
};

/** Compact context card shown below the main header on curriculum screens. */
export default function ContextBar({
  badgeLabel,
  title,
  subtitle,
  mascotSrc = "/finger-spelling/ksl-mascot.svg",
}: ContextBarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        bgcolor: "background.paper",
        borderRadius: `${KslRadii.card}px`,
        boxShadow: KslShadows.card,
        p: { xs: 2, md: 3 },
        mb: 3,
        maxWidth: 913,
        mx: "auto",
        width: "100%",
      }}
    >
      <Box
        sx={{
          width: 45,
          height: 43,
          borderRight: 1,
          borderColor: "divider",
          pr: 2,
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-hidden
      >
        <Box
          sx={{
            width: 24,
            height: 3,
            bgcolor: KslColors.secondary,
            boxShadow: `0 8px 0 ${KslColors.secondary}, 0 16px 0 ${KslColors.secondary}`,
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="h5"
          sx={{
            fontFamily: "var(--font-inter), sans-serif",
            fontWeight: 700,
            fontSize: KslFontSizes.lg,
            color: KslColors.secondary,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Badge label={badgeLabel} />
            <Typography
              variant="body1"
              sx={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },
                color: KslColors.secondary,
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          flexShrink: 0,
          width: { xs: 56, md: 84 },
          height: { xs: 57, md: 85 },
          position: "relative",
        }}
      >
        <Image
          src={mascotSrc}
          alt=""
          fill
          sizes="84px"
          style={{ objectFit: "contain" }}
        />
      </Box>
    </Box>
  );
}
