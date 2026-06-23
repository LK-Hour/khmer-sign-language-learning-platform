"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import NotFoundView from "@/components/NotFoundView";
import { isValidLocale } from "@/i18n/config";
import { useLocale } from "@/i18n";
import { t } from "@/i18n/translations";

function localeFromPathname(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isValidLocale(segment) ? segment : null;
}

export default function LocaleNotFound() {
  const pathname = usePathname();
  const contextLocale = useLocale();
  const locale = useMemo(
    () => localeFromPathname(pathname) ?? contextLocale,
    [pathname, contextLocale]
  );

  return (
    <NotFoundView
      title={t(locale, "pageNotFoundTitle")}
      message={t(locale, "pageNotFoundMessage")}
      goHomeLabel={t(locale, "goHome")}
      homeHref={`/${locale}`}
    />
  );
}
