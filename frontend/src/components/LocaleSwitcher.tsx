"use client";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Typography from "@mui/material/Typography";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import LocaleFlag from "@/components/ui/LocaleFlag";
import { LOCALE_NAMES, SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { useLocaleStore } from "@/i18n/localeStore";
import { kslColors, kslFontSizes, kslShadows } from "@/theme/theme";

const rowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  minHeight: 40,
  px: 1.5,
  py: 0.75,
  border: "none",
  bgcolor: "transparent",
  cursor: "pointer",
  textAlign: "left" as const,
  transition: "background-color 0.15s ease",
  "&:hover": {
    bgcolor: "rgba(18, 40, 76, 0.04)",
  },
};

const labelSx = {
  flex: 1,
  fontFamily: "var(--font-inter), sans-serif",
  fontSize: kslFontSizes.sm,
  fontWeight: 400,
  color: kslColors.secondary,
  lineHeight: 1.2,
  whiteSpace: "nowrap" as const,
};

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale } = useLocaleStore();
  const [open, setOpen] = useState(false);

  const otherLocale = SUPPORTED_LOCALES.find((loc) => loc !== locale) ?? "en";

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setOpen(false);

    const segments = pathname.split("/");
    if (SUPPORTED_LOCALES.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }

    const newPathname = segments.join("/") || `/${newLocale}`;
    router.push(newPathname);
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box
        sx={{
          position: "relative",
          minWidth: { xs: 132, sm: 168 },
          bgcolor: "background.paper",
          borderRadius: "10px",
          border: `1px solid ${kslColors.border}`,
          boxShadow: open ? kslShadows.card : "none",
        }}
      >
        <Box
          component="button"
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`Language: ${LOCALE_NAMES[locale]}`}
          onClick={() => setOpen((prev) => !prev)}
          sx={rowSx}
        >
          <LocaleFlag locale={locale} />
          <Typography component="span" sx={labelSx}>
            {LOCALE_NAMES[locale]}
          </Typography>
          {open ? (
            <KeyboardArrowUpIcon
              sx={{ fontSize: 20, color: kslColors.textSecondary }}
            />
          ) : (
            <KeyboardArrowDownIcon
              sx={{ fontSize: 20, color: kslColors.textSecondary }}
            />
          )}
        </Box>

        {open && (
          <Box
            sx={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              bgcolor: "background.paper",
              borderRadius: "10px",
              border: `1px solid ${kslColors.border}`,
              boxShadow: kslShadows.card,
              overflow: "hidden",
              zIndex: 1,
            }}
          >
            <Box
              component="button"
              type="button"
              role="option"
              aria-selected={false}
              aria-label={`Switch to ${LOCALE_NAMES[otherLocale]}`}
              onClick={() => handleLocaleChange(otherLocale)}
              sx={rowSx}
            >
              <LocaleFlag locale={otherLocale} />
              <Typography component="span" sx={labelSx}>
                {LOCALE_NAMES[otherLocale]}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </ClickAwayListener>
  );
}
