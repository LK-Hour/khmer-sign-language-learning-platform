import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslLineHeights, KslPalette } from "@/theme/theme";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <Card
      sx={{
        width: "100%",
        height: 120,
        borderRadius: "0px",
        overflow: "hidden",
        bgcolor: KslPalette.primary.main,
        isolation: "isolate",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 2,
      }}
    >
      <Stack
        spacing={1.8}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          color: KslColors.surface,
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "center",
            gap: 2.5,
            color: KslColors.surface,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: KslFontSizes.md,
              lineHeight: KslLineHeights.sm,
              fontWeight: 500,
              color: KslColors.surface,
            }}
          >
            {t("LOGIN.POWERED_BY")}
          </Typography>

          <Box
            component="img"
            src="/assets/cadt_footer.png"
            alt={t("BRAND.CADT_ALT")}
            sx={{
              height: 60,
              width: "auto",
              objectFit: "contain",
            }}
          />
        </Stack>
        <Typography
          sx={{
            fontSize: KslFontSizes.md,
            lineHeight: KslLineHeights.sm,
            fontWeight: 500,
            color: KslColors.surface,
          }}
        >
          @2026
        </Typography>
      </Stack>
    </Card>
  );
}