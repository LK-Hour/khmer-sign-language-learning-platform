"use client";

import Typography from "@mui/material/Typography";
import { useTranslation } from "@/i18n/useTranslation";

export default function ProfilePageContent() {
  const { t } = useTranslation();
  return (
    <Typography color="text.secondary">{t("fsProfileComingSoon")}</Typography>
  );
}
