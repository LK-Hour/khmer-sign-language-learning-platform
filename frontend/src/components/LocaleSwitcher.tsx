"use client";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ClickAwayListener, Stack, Typography } from "@mui/material";
import LocaleFlag from "@/components/ui/LocaleFlag";
import { LOCALE_NAMES, SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { useLocaleStore } from "@/i18n/localeStore";
import { KslColors, KslFontSizes, KslShadows } from "@/theme/theme";

const labelSx = {
  fontFamily: "var(--font-english), var(--font-khmer), sans-serif",
  fontSize: KslFontSizes.sm,
  fontWeight: 600,
  color: KslColors.text,
  lineHeight: 1.5,
  whiteSpace: "nowrap" as const,
};

const triggerSx = {
  ...labelSx,
  display: "inline-flex",
  alignItems: "center",
  gap: 0.75,
  px: 1.5,
  py: 0.75,
  borderRadius: "999px",
  border: "none",
  bgcolor: "transparent",
  cursor: "pointer",
  transition: "background-color 0.15s ease, color 0.15s ease",
  "&:hover": {
    bgcolor: KslColors.primaryLighter,
    color: KslColors.primary,
  },
};

const optionSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  px: 1.5,
  py: 1,
  border: "none",
  bgcolor: "transparent",
  cursor: "pointer",
  textAlign: "left" as const,
  transition: "background-color 0.15s ease",
  "&:hover": {
    bgcolor: KslColors.primaryLighter,
  },
};

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale } = useLocaleStore();
  const [open, setOpen] = useState(false);

  const otherLocale = SUPPORTED_LOCALES.find((loc) => loc !== locale) ?? "en";

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
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
      <Stack sx={{ position: "relative" }}>
        <Stack
          component="button"
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`Language: ${LOCALE_NAMES[locale]}`}
          onClick={() => setOpen((prev) => !prev)}
          sx={triggerSx}
        >
          <LocaleFlag locale={locale} />
          <Typography component="span" sx={labelSx}>
            {LOCALE_NAMES[locale]}
          </Typography>
          <KeyboardArrowDownIcon
            sx={{
              fontSize: 16,
              color: "inherit",
              transition: "transform 0.15s ease",
              transform: open ? "rotate(180deg)" : "none",
            }}
          />
        </Stack>

        {open && (
          <Stack
            sx={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: 168,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: KslShadows.card,
              overflow: "hidden",
              zIndex: 1300,
            }}
          >
            <Stack
              component="button"
              type="button"
              role="option"
              aria-selected={false}
              aria-label={`Switch to ${LOCALE_NAMES[otherLocale]}`}
              onClick={() => handleLocaleChange(otherLocale)}
              sx={optionSx}
            >
              <LocaleFlag locale={otherLocale} />
              <Typography component="span" sx={labelSx}>
                {LOCALE_NAMES[otherLocale]}
              </Typography>
            </Stack>
          </Stack>
        )}
      </Stack>
    </ClickAwayListener>
  );
}
