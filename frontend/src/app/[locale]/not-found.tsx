 "use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageContainer } from "@/components/layout";
import { useTranslation } from "@/i18n/useTranslation";

export default function LocaleNotFound() {
  const { t } = useTranslation();

  return (
    <PageContainer
      sx={{
        minHeight: "70dvh",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Stack spacing={2} sx={{ maxWidth: 560, textAlign: "center" }}>
        <Typography component="h1" variant="h4">
          {t("pageNotFoundTitle")}
        </Typography>
        <Typography color="text.secondary">
          {t("pageNotFoundMessage")}
        </Typography>
        <Button variant="contained" href="/" sx={{ alignSelf: "center" }}>
          {t("goHome")}
        </Button>
      </Stack>
    </PageContainer>
  );
}
