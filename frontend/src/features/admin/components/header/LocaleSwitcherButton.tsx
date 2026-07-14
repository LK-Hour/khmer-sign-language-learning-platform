"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import LocaleFlag from "@/components/ui/LocaleFlag";
import {
  SUPPORTED_LOCALES,
  LOCALE_FULL_NAMES,
  type Locale,
} from "@/i18n/config";
import { useLocale, useSetLocale } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";

function persistLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export default function LocaleSwitcherButton() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      setOpen(false);
      return;
    }
    setLocale(newLocale);
    persistLocaleCookie(newLocale);
    const segments = window.location.pathname.split("/");
    if (SUPPORTED_LOCALES.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join("/") || `/${newLocale}`;
    window.history.replaceState(null, "", newPath);
    setOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: "relative" }}>
        <Tooltip title={t("COMMON.LANGUAGE")}>
          <IconButton
            ref={anchorRef}
            size="small"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={t("COMMON.LANGUAGE")}
            aria-haspopup="true"
            aria-expanded={open}
          >
            <LocaleFlag locale={locale} size={20} />
          </IconButton>
        </Tooltip>

        {open && (
          <Paper
            elevation={8}
            sx={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: 140,
              py: 0.5,
              borderRadius: 1.5,
              zIndex: (theme) => theme.zIndex.modal,
            }}
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <Stack
                key={loc}
                component="button"
                type="button"
                direction="row"
                spacing={1}
                onClick={() => handleLocaleChange(loc)}
                sx={{
                  width: "100%",
                  alignItems: "center",
                  px: 2,
                  py: 1,
                  border: "none",
                  bgcolor: loc === locale ? "action.selected" : "transparent",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <LocaleFlag locale={loc} size={18} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: loc === locale ? 700 : 400,
                    color: "text.primary",
                  }}
                >
                  {LOCALE_FULL_NAMES[loc]}
                </Typography>
              </Stack>
            ))}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
