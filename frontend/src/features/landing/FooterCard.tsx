import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslLineHeights } from "@/theme/theme";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <Card
      sx={{
        width: "100%",
        borderRadius: "0px",
        overflow: "hidden",
        boxShadow: "none",
        isolation: "isolate",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        py: 2,
      }}
    >
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

      <Stack
        direction="row"
        sx={{
          position: "relative",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 3 },
        }}
      >
        <Typography
          sx={{
            position: "absolute",
            left: { xs: 16, sm: 24 },
            fontSize: KslFontSizes.md,
            lineHeight: KslLineHeights.sm,
            fontWeight: 500,
            color: KslColors.primary,
          }}
        >
          ©{year} {t("BRAND.NAME")}
        </Typography>

        <Typography
          sx={{
            fontSize: KslFontSizes.md,
            lineHeight: KslLineHeights.sm,
            fontWeight: 500,
            color: KslColors.primary,
          }}
        >
          {t("LOGIN.POWERED_BY")}
        </Typography>
      </Stack>
    </Card>
  );
}