import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslLineHeights } from "@/theme/theme";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <Stack
      sx={{
        width: "100%",
        borderRadius: "0px",
        overflow: "hidden",
        isolation: "isolate",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
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
            left: { xs: 12, sm: 16 },
            fontSize: KslFontSizes.xs,
            lineHeight: KslLineHeights.sm,
            fontWeight: 500,
            color: KslColors.textPrimary,
          }}
        >
          ©<strong>{year}</strong> {t("BRAND.NAME")}
        </Typography>

        <Typography
          sx={{
            fontSize: KslFontSizes.xs,
            lineHeight: KslLineHeights.sm,
            fontWeight: 500,
            color: KslColors.textPrimary,
            textTransform: 'capitalize',
          }}
        >
          {t("LOGIN.POWERED_BY")}
        </Typography>
      </Stack>
    </Stack>
  );
}