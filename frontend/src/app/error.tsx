"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageContainer } from "@/components/layout";
import { DEFAULT_LOCALE, isValidLocale } from "@/i18n/config";
import { t } from "@/i18n/translations";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function localeFromPathname(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isValidLocale(segment) ? segment : DEFAULT_LOCALE;
}

export default function RootError({ error, reset }: RootErrorProps) {
  const pathname = usePathname();
  const locale = useMemo(() => localeFromPathname(pathname), [pathname]);

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
          {t(locale, "ERROR.APP_TITLE")}
        </Typography>
        <Typography color="text.secondary">
          {t(locale, "ERROR.ROOT_MESSAGE")}
        </Typography>
        {error.digest ? (
          <Typography variant="caption" color="text.secondary">
            {t(locale, "ERROR.ID", { id: error.digest })}
          </Typography>
        ) : null}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ justifyContent: "center" }}
        >
          <Button variant="contained" onClick={reset}>
            {t(locale, "BUTTON.TRY_AGAIN")}
          </Button>
          <Button variant="outlined" href={`/${locale}`}>
            {t(locale, "BUTTON.GO_HOME")}
          </Button>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
