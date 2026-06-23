"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import NotFoundView from "@/components/NotFoundView";
import { DEFAULT_LOCALE, isValidLocale } from "@/i18n/config";
import { t } from "@/i18n/translations";

function localeFromPathname(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isValidLocale(segment) ? segment : DEFAULT_LOCALE;
}

export default function RootNotFound() {
  const pathname = usePathname();
  const locale = useMemo(() => localeFromPathname(pathname), [pathname]);

  return (
    <NotFoundView
      title={t(locale, "ERROR.PAGE_NOT_FOUND_TITLE")}
      message={t(locale, "ERROR.PAGE_NOT_FOUND_MESSAGE")}
      goHomeLabel={t(locale, "BUTTON.GO_HOME")}
      homeHref={`/${locale}`}
    />
  );
}
