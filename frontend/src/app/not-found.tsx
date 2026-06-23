import NotFoundView from "@/components/NotFoundView";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { t } from "@/i18n/translations";

export default function RootNotFound() {
  return (
    <NotFoundView
      title={t(DEFAULT_LOCALE, "pageNotFoundTitle")}
      message={t(DEFAULT_LOCALE, "pageNotFoundMessage")}
      goHomeLabel={t(DEFAULT_LOCALE, "goHome")}
      homeHref={`/${DEFAULT_LOCALE}`}
    />
  );
}
