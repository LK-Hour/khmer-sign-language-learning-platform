"use client";

import Link from "next/link";
import { Stack, Typography, Button } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { useTranslation } from "@/i18n/useTranslation";
import { ROUTES } from "@/constants/routes";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

export default function LessonLockedView() {
  const { locale, t } = useTranslation();

  return (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "center",
        py: 12,
        gap: 3,
        textAlign: "center",
      }}
    >
      <LockIcon
        sx={{
          fontSize: 72,
          color: KslColors.textSecondary,
          opacity: 0.5,
        }}
      />
      <Typography
        sx={{
          fontSize: KslFontSizes.xl,
          fontWeight: 700,
          color: KslColors.textPrimary,
        }}
      >
        {t("fsLessonLockedTitle")}
      </Typography>
      <Typography
        sx={{
          fontSize: KslFontSizes.md,
          color: KslColors.textSecondary,
          maxWidth: 400,
        }}
      >
        {t("fsLessonLockedMessage")}
      </Typography>
      <Button
        component={Link}
        href={`/${locale}${ROUTES.fingerSpelling.root}`}
        variant="contained"
        sx={{
          mt: 2,
          borderRadius: `${KslRadii.button}px`,
          fontSize: KslFontSizes.md,
          fontWeight: 700,
          minWidth: 180,
          minHeight: 46,
        }}
      >
        {t("fsLessonLockedBack")}
      </Button>
    </Stack>
  );
}