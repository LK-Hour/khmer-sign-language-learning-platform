"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageContainer } from "@/components/layout";
import { useTranslation } from "@/i18n/useTranslation";

type LocaleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ error, reset }: LocaleErrorProps) {
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
          {t("appErrorTitle")}
        </Typography>
        <Typography color="text.secondary">
          {t("localeErrorMessage")}
        </Typography>
        {error.digest ? (
          <Typography variant="caption" color="text.secondary">
            {t("errorId", { id: error.digest })}
          </Typography>
        ) : null}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ justifyContent: "center" }}
        >
          <Button variant="contained" onClick={reset}>
            {t("tryAgain")}
          </Button>
          <Button variant="outlined" href="/">
            {t("goHome")}
          </Button>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
