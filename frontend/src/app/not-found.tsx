import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageContainer } from "@/components/layout";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { t } from "@/i18n/translations";

export default function RootNotFound() {
  return (
    <PageContainer
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Stack spacing={2} sx={{ maxWidth: 560, textAlign: "center" }}>
        <Typography component="h1" variant="h4">
          {t(DEFAULT_LOCALE, "pageNotFoundTitle")}
        </Typography>
        <Typography color="text.secondary">
          {t(DEFAULT_LOCALE, "pageNotFoundMessage")}
        </Typography>
        <Button variant="contained" href={`/${DEFAULT_LOCALE}`} sx={{ alignSelf: "center" }}>
          {t(DEFAULT_LOCALE, "goHome")}
        </Button>
      </Stack>
    </PageContainer>
  );
}
